import { globby } from 'globby'

export async function walkFiles(cwd: string): Promise<string[]> {
	return globby('**/*', {
		cwd,
		gitignore: true,
		ignore: ['.jgrep/**', '.git/**'],
		dot: false,
		absolute: false,
		onlyFiles: true,
	})
}
