import pc from 'picocolors'
import type { OutputFormat, SearchResult } from '../types.js'

export function formatResults(results: SearchResult[], format: OutputFormat): string {
	if (results.length === 0) {
		return 'No matches.'
	}

	if (format === 'json') {
		return JSON.stringify(results, null, 2)
	}

	return results
		.map((result) => {
			const header =
				pc.bold(pc.cyan(`${result.file}:${result.startLine}-${result.endLine}`)) +
				' ' +
				pc.yellow(`(${result.score.toFixed(4)})`)
			const body = result.text
				.split('\n')
				.map((line) => `  ${line}`)
				.join('\n')
			return `${header}\n${body}`
		})
		.join('\n\n')
}
