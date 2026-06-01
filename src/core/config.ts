import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FgrepConfig } from '../types.js'

export const DEFAULT_CONFIG: FgrepConfig = {
	include: ['**/*'],
	exclude: [
		'vendor/**',
		'node_modules/**',
		'var/**',
		'dist/**',
		'*.lock',
		'*.min.js',
		'*.min.css',
		'public/build/**',
		'public/bundles/**',
		'STRUCTURE.md',
		'DOCUMENTATION.md',
	],
	model: 'voyage-code-3',
	topK: 10,
	chunkSize: 40,
	overlap: 10,
	minScore: 0.3,
	rerank: true,
	rerankCandidates: 30,
	hybridSearch: true,
	chunkStrategy: 'smart',
	maxPerFile: 2,
	voyageApiKey: '',
}

export async function loadConfig(cwd: string): Promise<FgrepConfig> {
	const rcPath = join(cwd, '.jgreprc')
	try {
		const raw = await readFile(rcPath, { encoding: 'utf-8' })
		const partial = JSON.parse(raw) as Partial<FgrepConfig>
		// exclude merges (union) so new default exclusions always apply
		const exclude = partial.exclude
			? [...new Set([...DEFAULT_CONFIG.exclude, ...partial.exclude])]
			: DEFAULT_CONFIG.exclude
		return { ...DEFAULT_CONFIG, ...partial, exclude }
	} catch {
		return { ...DEFAULT_CONFIG }
	}
}
