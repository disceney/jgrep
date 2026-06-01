import { globby } from 'globby'
import type { FgrepConfig } from '../types.js'

export async function walkFiles(cwd: string, config: FgrepConfig): Promise<string[]> {
	return globby(config.include, {
		cwd,
		gitignore: true,
		ignore: config.exclude,
		dot: false,
		absolute: false,
		onlyFiles: true,
	})
}
