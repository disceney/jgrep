import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import pc from 'picocolors'
import { DEFAULT_CONFIG } from '../core/config.js'
import { openTable } from '../core/store.js'

const JGREP_BLOCK = '###> jgrep ###\n/.jgrep/\n/.jgreprc\n###< jgrep ###'
const JGREP_MARKER = '###> jgrep ###'

export async function installCommand(opts: { apiKey?: string; force?: boolean }): Promise<void> {
	const cwd = process.cwd()
	const rcPath = join(cwd, '.jgreprc')
	const jgrepDir = join(cwd, '.jgrep')
	const gitignorePath = join(cwd, '.gitignore')

	// (1) Check if .jgreprc already exists
	const rcExists = await access(rcPath).then(() => true).catch(() => false)
	if (rcExists && !opts.force) {
		console.log(pc.yellow('⚠ .jgreprc already exists. Use --force to overwrite.'))
		return
	}

	// (2) Write .jgreprc with DEFAULT_CONFIG + voyageApiKey
	const config = {
		...DEFAULT_CONFIG,
		voyageApiKey: opts.apiKey ?? '',
	}
	await writeFile(rcPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'utf-8' })
	console.log(`  ${pc.green('✓')} ${pc.bold('.jgreprc')} ${pc.dim('created')}`)

	// (3) Create .jgrep directory if it does not exist
	await mkdir(jgrepDir, { recursive: true })
	console.log(`  ${pc.green('✓')} ${pc.bold('.jgrep/')} ${pc.dim('directory ready')}`)

	// (4) Initialize LanceDB table
	await openTable(cwd)
	console.log(`  ${pc.green('✓')} ${pc.bold('LanceDB')} ${pc.dim('table initialized')}`)

	// (5) Append jgrep block to .gitignore if not already present
	const gitignoreExists = await access(gitignorePath).then(() => true).catch(() => false)
	if (gitignoreExists) {
		const contents = await readFile(gitignorePath, { encoding: 'utf-8' })
		if (!contents.includes(JGREP_MARKER)) {
			const separator = contents.endsWith('\n') ? '' : '\n'
			await writeFile(gitignorePath, contents + separator + JGREP_BLOCK + '\n', { encoding: 'utf-8' })
			console.log(`  ${pc.green('✓')} ${pc.bold('.gitignore')} ${pc.dim('updated with jgrep block')}`)
		} else {
			console.log(`  ${pc.dim('· .gitignore already contains jgrep block, skipping')}`)
		}
	} else {
		await writeFile(gitignorePath, JGREP_BLOCK + '\n', { encoding: 'utf-8' })
		console.log(`  ${pc.green('✓')} ${pc.bold('.gitignore')} ${pc.dim('created with jgrep block')}`)
	}

	// (6) Success summary
	console.log(`\n${pc.green('✓')} ${pc.bold('jgrep installed successfully')} ${pc.dim('in')} ${pc.cyan(cwd)}`)
}
