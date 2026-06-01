import pc from 'picocolors'
import type { OutputFormat, SearchResult } from '../types.js'

export function formatResults(
	results: SearchResult[],
	format: OutputFormat,
	noText = false,
): string {
	if (results.length === 0) {
		return format === 'json' ? '[]' : 'No matches.'
	}

	if (format === 'json') {
		const out = noText
			? results.map(({ file, lang, startLine, endLine, score }) => ({
					file,
					lang,
					startLine,
					endLine,
					score,
				}))
			: results
		return JSON.stringify(out, null, 2)
	}

	return results
		.map((result) => {
			const header =
				pc.bold(pc.cyan(`${result.file}:${result.startLine}-${result.endLine}`)) +
				' ' +
				pc.yellow(`(${result.score.toFixed(4)})`)
			if (noText) return header
			const body = result.text
				.split('\n')
				.map((line) => `  ${line}`)
				.join('\n')
			return `${header}\n${body}`
		})
		.join('\n\n')
}
