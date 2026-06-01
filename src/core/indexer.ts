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
	const [existingHashes, files] = await Promise.all([
		getFileHashes(table),
		walkFiles(cwd, { include: config.include, exclude: config.exclude }),
	])
	const currentFileSet = new Set(files)

	const chunkFn = config.chunkStrategy === 'smart' ? chunkFileSmart : chunkFile
	const filesToEmbed: Array<{ file: string; hash: string; chunks: ReturnType<typeof chunkFn> }> = []

	for (const file of files) {
		const absolutePath = join(cwd, file)
		let content: string
		try {
			content = await readFile(absolutePath, { encoding: 'utf-8' })
		} catch {
			continue
		}

		// Skip files that appear binary (null bytes)
		if (content.includes('\0')) {
			onProgress?.(file, 'empty')
			continue
		}

		// Skip files exceeding the size limit
		const maxKb = config.maxFileSizeKb ?? 512
		if (Buffer.byteLength(content, 'utf-8') > maxKb * 1024) {
			onProgress?.(file, 'empty')
			continue
		}

		const hash = sha1(content)
		if (existingHashes.get(file) === hash) {
			onProgress?.(file, 'reused')
			continue
		}

		let chunks = chunkFn(file, content, config.chunkSize, config.overlap)
		const maxChunks = config.maxChunksPerFile ?? 80
		if (chunks.length > maxChunks) {
			chunks = chunks.slice(0, maxChunks)
		}
		if (chunks.length === 0) {
			onProgress?.(file, 'empty')
		} else {
			onProgress?.(file, 'embedding', chunks.length)
			filesToEmbed.push({ file, hash, chunks })
		}
	}

	// Remove deleted files
	const deletionPromises: Promise<void>[] = []
	for (const existingFile of existingHashes.keys()) {
		if (!currentFileSet.has(existingFile)) {
			deletionPromises.push(deleteChunksForFile(table, existingFile))
		}
	}
	// Remove stale chunks for files that will be re-embedded
	for (const entry of filesToEmbed) {
		if (existingHashes.has(entry.file)) {
			deletionPromises.push(deleteChunksForFile(table, entry.file))
		}
	}
	await Promise.all(deletionPromises)

	if (filesToEmbed.length === 0) {
		return { model: config.model, ...await getStats(table) }
	}

	const allTexts: string[] = []
	for (const entry of filesToEmbed) {
		for (const chunk of entry.chunks) {
			allTexts.push(chunk.text)
		}
	}

	const allEmbeddings = await embedTexts(allTexts, config.model, config.voyageApiKey)

	let embeddingOffset = 0
	const indexedChunks: Array<IndexedChunk & { fileHash: string }> = []
	for (const entry of filesToEmbed) {
		const lang = detectLang(entry.file)
		for (const chunk of entry.chunks) {
			indexedChunks.push({
				...chunk,
				lang,
				embedding: allEmbeddings[embeddingOffset] ?? [],
				fileHash: entry.hash,
			})
			embeddingOffset++
		}
	}

	await upsertChunks(table, indexedChunks)
	await createFTSIndex(table)

	return { model: config.model, ...await getStats(table) }
}
