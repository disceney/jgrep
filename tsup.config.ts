import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
	entry: ['src/cli.ts'],
	format: ['esm'],
	clean: true,
	define: {
		__PKG_VERSION__: JSON.stringify(pkg.version),
		__JGREP_REPO__: JSON.stringify('disceney/jgrep'),
	},
})
