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
			lang: '',
		})
	}

	return chunks
}

const BOUNDARY_PATTERNS: RegExp[] = [
	/^\s*(?:function\s+\w|(?:public|private|protected)\s+(?:static\s+)?function\s+\w)/,
	/^\s*(?:abstract\s+)?(?:final\s+)?class\s+\w/,
	/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\w/,
	/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(/,
	/^\s*(?:export\s+)?(?:abstract\s+)?class\s+\w/,
	/^\s*<(?:div|section|template|script|style)[\s>\/]/i,
	/^\s*<\?php\b/,
	/^\s*\?>/,
]

function isBoundary(line: string): boolean {
	return BOUNDARY_PATTERNS.some((pattern) => pattern.test(line))
}

export function chunkFileSmart(
	file: string,
	content: string,
	chunkSize: number,
	overlap: number,
): Chunk[] {
	if (content.trim() === '') {
		return []
	}

	const lines = content.split('\n')
	const maxLines = Math.floor(chunkSize * 1.5)
	const chunks: Chunk[] = []
	let startLine = 0

	while (startLine < lines.length) {
		const idealEnd = startLine + chunkSize
		const hardEnd = Math.min(startLine + maxLines, lines.length)

		let splitAt = hardEnd

		if (idealEnd < lines.length) {
			for (let i = idealEnd; i > startLine + 1; i--) {
				if (i < lines.length && isBoundary(lines[i]!)) {
					splitAt = i
					break
				}
			}

			if (splitAt === hardEnd) {
				for (let i = idealEnd + 1; i < hardEnd; i++) {
					if (isBoundary(lines[i]!)) {
						splitAt = i
						break
					}
				}
			}
		}

		const windowLines = lines.slice(startLine, splitAt)
		const text = windowLines.join('\n')

		if (text.trim() !== '') {
			chunks.push({
				file,
				startLine: startLine + 1,
				endLine: splitAt,
				text,
				lang: '',
			})
		}

		// When we've reached the end of file, stop — avoids tiny overlapping
		// chunks on small files where step would be near zero
		if (splitAt >= lines.length) break
		const step = splitAt - startLine - overlap
		startLine += step > 0 ? step : chunkSize - overlap
	}

	return chunks
}
