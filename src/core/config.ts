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
	],
	model: 'voyage-code-3',
	topK: 10,
	chunkSize: 40,
	overlap: 10,
	minScore: 0.3,
}

export async function loadConfig(cwd: string): Promise<FgrepConfig> {
	const rcPath = join(cwd, '.jgreprc')
	try {
		const raw = await readFile(rcPath, { encoding: 'utf-8' })
		const partial = JSON.parse(raw) as Partial<FgrepConfig>
		return { ...DEFAULT_CONFIG, ...partial }
	} catch {
		return { ...DEFAULT_CONFIG }
	}
}
