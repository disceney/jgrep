import { connect } from '@lancedb/lancedb'
import { Field, FixedSizeList, Float32, Int32, Schema, Utf8 } from 'apache-arrow'
import { join } from 'node:path'
import type { IndexedChunk } from '../types.js'

const TABLE_NAME = 'chunks'

const ARROW_SCHEMA = new Schema([
	new Field('file', new Utf8(), false),
	new Field('lang', new Utf8(), false),
	new Field('startLine', new Int32(), false),
	new Field('endLine', new Int32(), false),
	new Field('text', new Utf8(), false),
	new Field('fileHash', new Utf8(), false),
	new Field('vector', new FixedSizeList(1024, new Field('item', new Float32(), false)), false),
])

export async function openTable(cwd: string): Promise<any> {
	const dbPath = join(cwd, '.jgrep')
	const db = await connect(dbPath)
	try {
		return await db.openTable(TABLE_NAME)
	} catch {
		return await db.createEmptyTable(TABLE_NAME, ARROW_SCHEMA)
	}
}

export async function upsertChunks(
	table: any,
	chunks: Array<IndexedChunk & { fileHash: string }>,
): Promise<void> {
	const records = chunks.map((chunk) => ({
		file: chunk.file,
		lang: chunk.lang,
		startLine: chunk.startLine,
		endLine: chunk.endLine,
		text: chunk.text,
		fileHash: chunk.fileHash,
		vector: chunk.embedding,
	}))
	await table.add(records)
}

export async function deleteChunksForFile(table: any, file: string): Promise<void> {
	await table.delete("file = '" + file.replaceAll("'", "''") + "'")
}

export async function getFileHashes(table: any): Promise<Map<string, string>> {
	try {
		const rows = await table.query().select(['file', 'fileHash']).limit(1_000_000).toArray()
		const map = new Map<string, string>()
		for (const row of rows) {
			map.set(row['file'] as string, row['fileHash'] as string)
		}
		return map
	} catch {
		return new Map()
	}
}

export async function getStats(table: any): Promise<{ fileCount: number; chunkCount: number }> {
	try {
		const chunkCount: number = await table.countRows()
		const rows = await table.query().select(['file']).limit(1_000_000).toArray()
		const fileCount = new Set(rows.map((r: any) => r['file'] as string)).size
		return { fileCount, chunkCount }
	} catch {
		return { fileCount: 0, chunkCount: 0 }
	}
}
