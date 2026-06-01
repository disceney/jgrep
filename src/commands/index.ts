import { watch } from 'node:fs'
import { join } from 'node:path'
import pc from 'picocolors'
import { loadConfig } from '../core/config.js'
import { buildIndexIncremental, type ProgressCallback } from '../core/indexer.js'
import type { IndexData } from '../types.js'

const FGREP_DIR = '.jgrep'
const DEBOUNCE_MS = 300

function makeProgress(label?: string): ProgressCallback {
	const isTTY = process.stdout.isTTY
	let seen = 0
	const tag = label ? `${pc.dim(`[${label}]`)} ` : ''
	return (file, status, chunks) => {
		seen++
		if (status === 'embedding') {
			if (isTTY) process.stdout.write(`\r\x1b[K`)
			console.log(
				`  ${tag}${pc.green('+')} ${pc.cyan(file)} ${pc.dim(`${chunks} chunk${chunks === 1 ? '' : 's'}`)}`,
			)
		} else if (isTTY) {
			process.stdout.write(`\r\x1b[K  ${tag}${pc.dim(file)}`)
		}
	}
}

async function runBuild(cwd: string, label?: string): Promise<IndexData> {
	const config = await loadConfig(cwd)
	const tag = label ? `${pc.dim(`[${label}]`)} ` : ''

	console.log(`\n${tag}${pc.bold('Indexing')} ${pc.dim(cwd)}`)

	const index = await buildIndexIncremental(cwd, config, null, makeProgress(label))

	if (process.stdout.isTTY) process.stdout.write(`\r\x1b[K`)

	console.log(
		`  ${pc.green('✓')} ${pc.bold(String(index.fileCount))} file(s) · ${pc.bold(String(index.chunkCount))} chunk(s)`,
	)

	return index
}

export async function indexCommand(opts: { watch?: boolean }): Promise<void> {
	const cwd = process.cwd()
	let current = await runBuild(cwd)

	if (!opts.watch) return

	console.log(`\n${pc.yellow('⦿')} ${pc.dim('Watching for changes… (Ctrl+C to stop)')}`)

	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	watch(cwd, { recursive: true }, (_, filename) => {
		if (filename === null) return
		if (filename.startsWith(FGREP_DIR + '/') || filename === FGREP_DIR) return
		if (filename.startsWith(join(FGREP_DIR, '/'))) return

		if (debounceTimer !== null) clearTimeout(debounceTimer)

		debounceTimer = setTimeout(async () => {
			debounceTimer = null
			try {
				current = await runBuild(cwd, 'watch')
			} catch (err) {
				console.error(pc.red(`[watch] ${err instanceof Error ? err.message : String(err)}`))
			}
		}, DEBOUNCE_MS)
	})
}
