import { extname } from 'path'

const EXT_MAP: Record<string, string> = {
	'.ts': 'typescript',
	'.tsx': 'typescript',
	'.js': 'javascript',
	'.jsx': 'javascript',
	'.php': 'php',
	'.py': 'python',
	'.go': 'go',
	'.rb': 'ruby',
	'.java': 'java',
	'.cs': 'csharp',
	'.rs': 'rust',
	'.md': 'markdown',
	'.mdx': 'markdown',
	'.json': 'json',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.html': 'html',
	'.twig': 'html',
	'.css': 'css',
	'.scss': 'css',
	'.less': 'css',
	'.sh': 'shell',
	'.bash': 'shell',
}

export function detectLang(file: string): string {
	const ext = extname(file).toLowerCase()
	return EXT_MAP[ext] ?? 'text'
}
