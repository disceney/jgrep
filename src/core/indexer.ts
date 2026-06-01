import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FgrepConfig, IndexData, IndexedChunk } from '../types.js'
import { chunkFile, chunkFileSmart } from './chunker.js'
import { embedTexts } from './embeddings.js'
import { detectLang } from './lang.js'
import { createFTSIndex, deleteChunksForFile, getFileHashes, getStats, openTable, upsertChunks } from './store.js'
import { walkFiles } from './walker.js'

export type FileStatus = 'reused' | 'embedding' | 'empty'
export type ProgressCallback = (file: string, status: FileStatus, chunks?: number) => void

function sha1(content: string): string {
	return createHash('sha1').update(content).digest('hex')
}

export async function buildIndex(
	cwd: string,
	config: FgrepConfig,
	onProgress?: ProgressCallback,
): Promise<IndexData> {
	return buildIndexIncremental(cwd, config, null, onProgress)
}

export async function buildIndexIncremental(
	cwd: string,
	config: FgrepConfig,
	previous: IndexData | null = null,
	onProgress?: ProgressCallback,
): Promise<IndexData> {
	const table = await openTable(cwd)
	const existingHashes = await getFileHashes(table)
	const files = await walkFiles(cwd, config)
	const currentFileSet = new Set(files)

	const reusedFiles = new Set<string>()
	const chunkFn = config.chunkStrategy === 'smart' ? chunkFileSmart : chunkFile
	const filesToEmbed: Array<{ file: string; hash: string; chunks: ReturnType<typeof chunkFn> }> =
		[]

	for (const file of files) {
		const absolutePath = join(cwd, file)
		let content: string
		try {
			content = await readFile(absolutePath, { encoding: 'utf-8' })
		} catch {
			continue
		}

		const hash = sha1(content)
		const existingHash = existingHashes.get(file)

		if (existingHash !== undefined && existingHash === hash) {
			reusedFiles.add(file)
			onProgress?.(file, 'reused')
			continue
		}

		const chunks = chunkFn(file, content, config.chunkSize, config.overlap)
		if (chunks.length === 0) {
			onProgress?.(file, 'empty')
		} else {
			onProgress?.(file, 'embedding', chunks.length)
			filesToEmbed.push({ file, hash, chunks })
		}
	}

	for (const existingFile of existingHashes.keys()) {
		if (!currentFileSet.has(existingFile)) {
			await deleteChunksForFile(table, existingFile)
		}
	}

	for (const entry of filesToEmbed) {
		if (existingHashes.has(entry.file)) {
			await deleteChunksForFile(table, entry.file)
		}
	}

	const allTexts: string[] = []
	for (const entry of filesToEmbed) {
		for (const chunk of entry.chunks) {
			allTexts.push(chunk.text)
		}
	}

	if (allTexts.length > 0) {
		const allEmbeddings = await embedTexts(allTexts, config.model, config.voyageApiKey)
		let embeddingOffset = 0
		const indexedChunks: Array<IndexedChunk & { fileHash: string }> = []

		for (const entry of filesToEmbed) {
			const lang = detectLang(entry.file)
			for (const chunk of entry.chunks) {
				const embedding = allEmbeddings[embeddingOffset] ?? []
				embeddingOffset++
				indexedChunks.push({ ...chunk, lang, embedding, fileHash: entry.hash })
			}
		}

		await upsertChunks(table, indexedChunks)
		await createFTSIndex(table)
	}

	const stats = await getStats(table)
	return { model: config.model, ...stats }
}
