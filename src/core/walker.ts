import { globby } from 'globby'

const BINARY_EXTENSIONS = new Set([
	'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'avif',
	'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus',
	'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv',
	'zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'xz',
	'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
	'ttf', 'woff', 'woff2', 'eot', 'otf',
	'exe', 'dll', 'so', 'dylib', 'bin', 'o', 'a',
	'pyc', 'class', 'jar',
	'db', 'sqlite', 'sqlite3',
	'DS_Store',
])

function isBinary(file: string): boolean {
	const ext = file.split('.').pop()?.toLowerCase() ?? ''
	return BINARY_EXTENSIONS.has(ext)
}

// Always-excluded patterns — generated/lock files with no code-search value
const ALWAYS_IGNORED = [
	'.jgrep/**',
	'.git/**',
	// Lock files (committed in many projects but not useful for code search)
	'**/*.lock',
	'**/package-lock.json',
	'**/yarn.lock',
	'**/bun.lockb',
	// Minified assets
	'**/*.min.js',
	'**/*.min.css',
	// Source maps
	'**/*.map',
]

export async function walkFiles(cwd: string): Promise<string[]> {
	const files = await globby('**/*', {
		cwd,
		gitignore: true,
		ignore: ALWAYS_IGNORED,
		dot: false,
		absolute: false,
		onlyFiles: true,
	})

	return files.filter((f) => !isBinary(f))
}
