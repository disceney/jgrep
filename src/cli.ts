#!/usr/bin/env node
import pc from 'picocolors'
import { Command } from 'commander'
import { indexCommand } from './commands/index.js'
import { searchCommand } from './commands/search.js'

const program = new Command()

program.name('jgrep').version('0.1.0')

program
	.command('index')
	.description('Build or update the semantic search index')
	.option('--watch', 'Watch for file changes and rebuild incrementally')
	.action(async (opts: { watch?: boolean }) => {
		await indexCommand({ watch: opts.watch })
	})

program
	.command('search <query...>', { isDefault: true })
	.description('Search the index with a natural language query')
	.option('--json', 'Output results as JSON')
	.option('--topK <n>', 'Number of results to return', (v) => parseInt(v, 10))
	.option('--lang <langs>', 'Filter by language(s), comma-separated (e.g. ts,php,py)')
	.action(async (queryParts: string[], opts: { json?: boolean; topK?: number; lang?: string }) => {
		const query = queryParts.join(' ')
		await searchCommand(query, { json: opts.json, topK: opts.topK, lang: opts.lang })
	})

program.parseAsync(process.argv).catch((err: unknown) => {
	console.error(pc.red(err instanceof Error ? err.message : String(err)))
	process.exit(1)
})
