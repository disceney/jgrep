import { loadConfig } from '../core/config.js'
import { embedQuery } from '../core/embeddings.js'
import { searchIndex } from '../core/search.js'
import { openTable } from '../core/store.js'
import { formatResults } from '../output/formatter.js'
import type { SearchOptions } from '../types.js'

export async function searchCommand(
	query: string,
	opts: { json?: boolean; topK?: number; lang?: string; minScore?: number; noText?: boolean },
): Promise<void> {
	const cwd = process.cwd()
	const config = await loadConfig(cwd)
	const table = await openTable(cwd)

	if (table === null) {
		console.error('No index found. Run `jgrep index` first to build the search index.')
		process.exit(1)
	}

	const langs: string[] = opts.lang
		? opts.lang
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		: []
	const searchOpts: SearchOptions = {
		topK: opts.topK ?? config.topK,
		minScore: opts.minScore ?? config.minScore,
		langs,
	}

	const embedding = await embedQuery(query, config.model, config.voyageApiKey)
	const results = await searchIndex(embedding, query, table, searchOpts, config)
	const format = opts.json ? 'json' : 'pretty'

	console.log(formatResults(results, format, opts.noText))
}
