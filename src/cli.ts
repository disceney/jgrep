#!/usr/bin/env node
import { access } from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import { Command } from 'commander'
import { indexCommand } from './commands/index.js'
import { searchCommand } from './commands/search.js'
import { installCommand } from './commands/install.js'

async function checkInstalled(cwd: string): Promise<void> {
	try {
		await access(path.join(cwd, '.jgreprc'))
	} catch {
		process.stderr.write(pc.red('Error: jgrep is not initialized. Run `jgrep install` first.') + '\n')
		process.exit(1)
	}
}

const program = new Command()

program.name('jgrep').version('0.1.0')

program
	.command('index')
	.description('Build or update the semantic search index')
	.option('--watch', 'Watch for file changes and rebuild incrementally')
	.action(async (opts: { watch?: boolean }) => {
		await checkInstalled(process.cwd())
		await indexCommand({ watch: opts.watch })
	})

program
	.command('search <query...>', { isDefault: true })
	.description('Search the index with a natural language query')
	.option('--json', 'Output results as JSON')
	.option('--topK <n>', 'Number of results to return', (v) => parseInt(v, 10))
	.option('--lang <langs>', 'Filter by language(s), comma-separated (e.g. ts,php,py)')
	.option('--min-score <n>', 'Minimum relevance score (0-1), overrides .jgreprc', (v) => parseFloat(v))
	.option('--compact', 'Omit chunk text from output (file, lines and score only — for agents)')
	.action(async (queryParts: string[], opts: { json?: boolean; topK?: number; lang?: string; minScore?: number; compact?: boolean }) => {
		await checkInstalled(process.cwd())
		const query = queryParts.join(' ')
		await searchCommand(query, { json: opts.json, topK: opts.topK, lang: opts.lang, minScore: opts.minScore, noText: opts.compact })
	})

program
	.command('install')
	.description('Initialize jgrep in the current project')
	.option('--api-key <key>', 'Voyage AI API key to store in .jgreprc')
	.option('--force', 'Overwrite existing .jgreprc')
	.action(async (opts: { apiKey?: string; force?: boolean }) => {
		await installCommand({ apiKey: opts.apiKey, force: opts.force })
	})

program.parseAsync(process.argv).catch((err: unknown) => {
	console.error(pc.red(err instanceof Error ? err.message : String(err)))
	process.exit(1)
})
