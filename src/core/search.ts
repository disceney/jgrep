import type { FgrepConfig, SearchOptions, SearchResult } from '../types.js'
import { fullTextSearch } from './store.js'
import { rerankResults } from './reranker.js'

const RRF_K = 60

function fuseWithRRF(
	denseRows: any[],
	bm25Rows: any[],
): Map<string, { row: any; score: number; cosineScore: number }> {
	const fused = new Map<string, { row: any; score: number; cosineScore: number }>()

	const key = (row: any): string => row.file + ':' + row.startLine

	for (let i = 0; i < denseRows.length; i++) {
		const row = denseRows[i]
		const k = key(row)
		const cosineScore = 1 - (row._distance ?? 1)
		const existing = fused.get(k) ?? { row, score: 0, cosineScore }
		existing.score += 1 / (RRF_K + i + 1)
		// Keep the best cosine score seen for this chunk
		if (cosineScore > existing.cosineScore) existing.cosineScore = cosineScore
		fused.set(k, existing)
	}

	for (let i = 0; i < bm25Rows.length; i++) {
		const row = bm25Rows[i]
		const k = key(row)
		const existing = fused.get(k) ?? { row, score: 0, cosineScore: 0 }
		existing.score += 1 / (RRF_K + i + 1)
		fused.set(k, existing)
	}

	return fused
}

function chunksOverlap(a: { startLine: number; endLine: number }, b: { startLine: number; endLine: number }): boolean {
	const overlapStart = Math.max(a.startLine, b.startLine)
	const overlapEnd = Math.min(a.endLine, b.endLine)
	if (overlapEnd <= overlapStart) return false
	const overlapLines = overlapEnd - overlapStart
	const minSize = Math.min(a.endLine - a.startLine, b.endLine - b.startLine)
	// Threshold 0.2: catches natural indexer overlap (overlap=10 on 40-line chunks ≈ 25%)
	return minSize > 0 && overlapLines / minSize > 0.2
}

export async function searchIndex(
	queryEmbedding: number[],
	queryText: string,
	table: any,
	opts: SearchOptions,
	config: FgrepConfig,
): Promise<SearchResult[]> {
	const topK = opts.topK ?? config.topK ?? 10
	// Fetch a larger candidate pool so reranking and RRF have richer material
	const candidateCount = Math.max(topK * 5, 50)

	let results: SearchResult[]

	// cosineMinScore: pre-rerank quality gate applied on cosine similarity before the
	// reranker runs. Filters out genuinely irrelevant candidates so minScore is meaningful
	// even when reranking normalises scores relative to the query.
	const cosineMinScore = (opts.minScore ?? config.minScore ?? 0) * 0.65

	if (config.hybridSearch) {
		// Dense vector search — fetch candidate pool
		let denseQ = table
			.vectorSearch(queryEmbedding)
			.distanceType('cosine')
			.limit(candidateCount)

		if (Array.isArray(opts.langs) && opts.langs.length > 0) {
			denseQ = denseQ.where("lang IN ('" + opts.langs.join("','") + "')")
		}

		const denseRows: any[] = await denseQ.toArray()

		// BM25 full-text search — graceful fallback to empty on failure
		const bm25Rows: any[] = await fullTextSearch(table, queryText, candidateCount)

		// Apply language filter to BM25 rows (fullTextSearch does not filter)
		const filteredBm25Rows =
			Array.isArray(opts.langs) && opts.langs.length > 0
				? bm25Rows.filter((r) => opts.langs!.includes(r.lang))
				: bm25Rows

		// Fuse with RRF (also tracks cosine score per chunk)
		const fused = fuseWithRRF(denseRows, filteredBm25Rows)

		const rerankCandidates = config.rerankCandidates ?? candidateCount

		const sorted = Array.from(fused.values())
			.sort((a, b) => b.score - a.score)
			// Pre-rerank cosine quality gate: eliminates truly irrelevant candidates
			.filter(({ cosineScore }) => cosineScore >= cosineMinScore)
			.slice(0, rerankCandidates)

		// Normalise RRF scores to [0,1] so minScore is comparable to cosine scores
		const maxRRF = sorted[0]?.score ?? 1
		results = sorted.map(({ row, score }) => ({
			file: row.file,
			lang: row.lang,
			startLine: row.startLine,
			endLine: row.endLine,
			text: row.text,
			score: maxRRF > 0 ? score / maxRRF : 0,
		}))
	} else {
		// Pure dense vector search (original behaviour)
		let q = table
			.vectorSearch(queryEmbedding)
			.distanceType('cosine')
			.limit(candidateCount)

		if (Array.isArray(opts.langs) && opts.langs.length > 0) {
			q = q.where("lang IN ('" + opts.langs.join("','") + "')")
		}

		const rows: any[] = await q.toArray()

		results = rows.map((row: any) => ({
			file: row.file,
			lang: row.lang,
			startLine: row.startLine,
			endLine: row.endLine,
			text: row.text,
			score: 1 - (row._distance ?? 1),
		}))
	}

	// Optional reranking stage — env takes priority over config key
	const rerankKey = process.env['VOYAGE_API_KEY'] ?? config.voyageApiKey
	if (config.rerank && rerankKey) {
		results = await rerankResults(queryText, results, topK, rerankKey)
	}

	// Apply minScore filter
	const minScore = opts.minScore ?? config.minScore ?? 0
	const filtered = results
		.filter((r) => r.score >= minScore)
		.sort((a, b) => b.score - a.score)

	// Deduplicate: cap chunks per file so one file never dominates results;
	// also skip chunks that overlap significantly with an already-included chunk.
	const maxPerFile = config.maxPerFile ?? 2
	const seenPerFile = new Map<string, number>()
	const includedByFile = new Map<string, Array<{ startLine: number; endLine: number }>>()
	const deduped: SearchResult[] = []
	for (const r of filtered) {
		const count = seenPerFile.get(r.file) ?? 0
		if (count >= maxPerFile) continue

		const included = includedByFile.get(r.file) ?? []
		if (included.some((prev) => chunksOverlap(prev, r))) continue

		deduped.push(r)
		seenPerFile.set(r.file, count + 1)
		included.push({ startLine: r.startLine, endLine: r.endLine })
		includedByFile.set(r.file, included)

		if (deduped.length >= topK) break
	}

	return deduped
}
