import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import pc from 'picocolors'
import { DEFAULT_CONFIG } from '../core/config.js'
import { openTable } from '../core/store.js'

const JGREP_BLOCK = '###> jgrep ###\n/.jgrep/\n/.jgreprc\n###< jgrep ###'
const JGREP_MARKER = '###> jgrep ###'

// Known project-type signatures → extra exclude patterns to inject into .jgreprc
const PROJECT_EXCLUDES: Array<{
	detectFile: string
	detectContent?: string
	excludes: string[]
	label: string
}> = [
	{
		detectFile: 'composer.json',
		detectContent: 'symfony/framework-bundle',
		excludes: ['vendor/**', 'var/**', 'public/bundles/**', 'public/build/**'],
		label: 'Symfony',
	},
	{
		detectFile: 'composer.json',
		detectContent: undefined,
		excludes: ['vendor/**'],
		label: 'PHP/Composer',
	},
	{
		detectFile: 'package.json',
		detectContent: undefined,
		excludes: ['node_modules/**', 'dist/**', 'build/**', '.next/**', '.nuxt/**'],
		label: 'Node.js',
	},
	{
		detectFile: 'Cargo.toml',
		detectContent: undefined,
		excludes: ['target/**'],
		label: 'Rust/Cargo',
	},
	{
		detectFile: 'go.mod',
		detectContent: undefined,
		excludes: ['vendor/**'],
		label: 'Go',
	},
	{
		detectFile: 'requirements.txt',
		detectContent: undefined,
		excludes: ['venv/**', '.venv/**', '__pycache__/**', '*.pyc'],
		label: 'Python',
	},
]

async function detectProjectExcludes(
	cwd: string,
): Promise<{ excludes: string[]; label: string | null }> {
	for (const sig of PROJECT_EXCLUDES) {
		const filePath = join(cwd, sig.detectFile)
		const exists = await access(filePath)
			.then(() => true)
			.catch(() => false)
		if (!exists) continue
		if (sig.detectContent) {
			const content = await readFile(filePath, { encoding: 'utf-8' }).catch(() => '')
			if (!content.includes(sig.detectContent)) continue
		}
		return { excludes: sig.excludes, label: sig.label }
	}
	return { excludes: [], label: null }
}

export async function installCommand(opts: { apiKey?: string; force?: boolean }): Promise<void> {
	const cwd = process.cwd()
	const rcPath = join(cwd, '.jgreprc')
	const jgrepDir = join(cwd, '.jgrep')
	const gitignorePath = join(cwd, '.gitignore')

	// (1) Check if .jgreprc already exists
	const rcExists = await access(rcPath)
		.then(() => true)
		.catch(() => false)
	if (rcExists && !opts.force) {
		console.log(pc.yellow('⚠ .jgreprc already exists. Use --force to overwrite.'))
		return
	}

	// (2) Detect project type and build tailored config
	const { excludes, label } = await detectProjectExcludes(cwd)
	const config: Record<string, unknown> = { ...DEFAULT_CONFIG, voyageApiKey: opts.apiKey ?? '' }
	if (excludes.length > 0) {
		config['exclude'] = excludes
	}
	await writeFile(rcPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'utf-8' })
	const projectHint = label ? pc.dim(` (${label} project detected)`) : ''
	console.log(`  ${pc.green('✓')} ${pc.bold('.jgreprc')} ${pc.dim('created')}${projectHint}`)

	// (3) Create .jgrep directory if it does not exist
	await mkdir(jgrepDir, { recursive: true })
	console.log(`  ${pc.green('✓')} ${pc.bold('.jgrep/')} ${pc.dim('directory ready')}`)

	// (4) Initialize LanceDB table
	await openTable(cwd)
	console.log(`  ${pc.green('✓')} ${pc.bold('LanceDB')} ${pc.dim('table initialized')}`)

	// (5) Append jgrep block to .gitignore if not already present
	const gitignoreExists = await access(gitignorePath)
		.then(() => true)
		.catch(() => false)
	if (gitignoreExists) {
		const contents = await readFile(gitignorePath, { encoding: 'utf-8' })
		if (!contents.includes(JGREP_MARKER)) {
			const separator = contents.endsWith('\n') ? '' : '\n'
			await writeFile(gitignorePath, contents + separator + JGREP_BLOCK + '\n', {
				encoding: 'utf-8',
			})
			console.log(
				`  ${pc.green('✓')} ${pc.bold('.gitignore')} ${pc.dim('updated with jgrep block')}`,
			)
		} else {
			console.log(`  ${pc.dim('· .gitignore already contains jgrep block, skipping')}`)
		}
	} else {
		await writeFile(gitignorePath, JGREP_BLOCK + '\n', { encoding: 'utf-8' })
		console.log(`  ${pc.green('✓')} ${pc.bold('.gitignore')} ${pc.dim('created with jgrep block')}`)
	}

	// (6) Success summary
	console.log(
		`\n${pc.green('✓')} ${pc.bold('jgrep installed successfully')} ${pc.dim('in')} ${pc.cyan(cwd)}`,
	)
}
