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
	'.mdx': 'mdx',
	'.json': 'json',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.html': 'html',
	'.twig': 'twig',
	'.vue': 'vue',
	'.svelte': 'svelte',
	'.css': 'css',
	'.scss': 'scss',
	'.less': 'less',
	'.sh': 'shell',
	'.bash': 'bash',
	'.sql': 'sql',
	'.graphql': 'graphql',
	'.gql': 'graphql',
	'.toml': 'toml',
	'.xml': 'xml',
}

export function detectLang(file: string): string {
	const ext = extname(file).toLowerCase()
	return EXT_MAP[ext] ?? 'text'
}
