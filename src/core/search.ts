import type { SearchOptions, SearchResult } from '../types.js'

export async function searchIndex(
	queryEmbedding: number[],
	table: any,
	opts: SearchOptions,
): Promise<SearchResult[]> {
	let q = table
		.vectorSearch(queryEmbedding)
		.distanceType('cosine')
		.limit(opts.topK ?? 10)

	if (Array.isArray(opts.langs) && opts.langs.length > 0) {
		q = q.where("lang IN ('" + opts.langs.join("','") + "')")
	}

	const rows = await q.toArray()

	const results: SearchResult[] = rows.map((row: any) => ({
		file: row.file,
		lang: row.lang,
		startLine: row.startLine,
		endLine: row.endLine,
		text: row.text,
		score: 1 - (row._distance ?? 1),
	}))

	return results.filter((r) => r.score >= (opts.minScore ?? 0)).sort((a, b) => b.score - a.score)
}
