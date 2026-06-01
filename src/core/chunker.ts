import type { Chunk } from '../types.js'

export function chunkFile(
	file: string,
	content: string,
	chunkSize: number,
	overlap: number,
): Chunk[] {
	if (overlap >= chunkSize) {
		throw new Error(`overlap (${overlap}) must be less than chunkSize (${chunkSize})`)
	}

	const lines = content.split('\n')
	const step = chunkSize - overlap
	const chunks: Chunk[] = []

	for (let i = 0; i < lines.length; i += step) {
		const windowLines = lines.slice(i, i + chunkSize)
		const text = windowLines.join('\n')
		if (text.trim() === '') {
			continue
		}
		chunks.push({
			file,
			startLine: i + 1,
			endLine: i + windowLines.length,
			text,
		})
	}

	return chunks
}
