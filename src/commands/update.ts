import { execSync } from 'node:child_process'
import pc from 'picocolors'

declare const __PKG_VERSION__: string
declare const __JGREP_REPO__: string

interface GithubRelease {
	tag_name: string
	name: string
	body: string
}

function currentVersion(): string {
	return __PKG_VERSION__
}

function repo(): string {
	return __JGREP_REPO__
}

async function fetchLatestRelease(): Promise<GithubRelease> {
	const url = `https://api.github.com/repos/${repo()}/releases/latest`
	const res = await fetch(url, {
		headers: { 'User-Agent': 'jgrep-cli', Accept: 'application/vnd.github+json' },
	})
	if (!res.ok) {
		throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
	}
	return res.json() as Promise<GithubRelease>
}

function buildDownloadUrl(tag: string): string {
	const version = tag.replace(/^v/, '')
	return `https://github.com/${repo()}/releases/download/${tag}/jgrep-${version}.tgz`
}

export async function updateCommand(opts: { check?: boolean }): Promise<void> {
	const current = currentVersion()
	process.stdout.write(`Checking for updates… `)

	let latest: GithubRelease
	try {
		latest = await fetchLatestRelease()
	} catch (err) {
		process.stdout.write('\n')
		process.stderr.write(
			pc.red(`Failed to reach GitHub: ${err instanceof Error ? err.message : String(err)}\n`),
		)
		process.exit(1)
	}

	const latestTag = latest.tag_name
	const latestVersion = latestTag.replace(/^v/, '')

	if (latestVersion === current) {
		process.stdout.write(pc.green('up to date') + '\n')
		console.log(`  ${pc.dim(`jgrep v${current} is the latest release`)}`)
		return
	}

	process.stdout.write('\n')
	console.log(`  ${pc.yellow('⬆')} ${pc.dim(`v${current}`)} → ${pc.green(`v${latestVersion}`)}`)

	if (latest.body?.trim()) {
		console.log(
			`\n${pc.bold("What's new:")}\n${pc.dim(latest.body.trim().split('\n').slice(0, 5).join('\n'))}`,
		)
	}

	if (opts.check) {
		console.log(`\nRun ${pc.cyan('jgrep update')} to install the latest version.`)
		return
	}

	const url = buildDownloadUrl(latestTag)
	console.log(`\n  ${pc.dim('Downloading')} ${pc.cyan(url)}`)

	try {
		execSync(`npm install -g "${url}"`, { stdio: 'inherit' })
		console.log(`\n${pc.green('✓')} Updated to ${pc.bold(`v${latestVersion}`)}`)
	} catch {
		process.stderr.write(pc.red('\nUpdate failed. Try running manually:\n'))
		process.stderr.write(pc.cyan(`  npm install -g "${url}"\n`))
		process.exit(1)
	}
}
