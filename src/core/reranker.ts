import { VoyageAIClient } from 'voyageai'

import type { SearchResult } from '../types.js'

export async function rerankResults(
	query: string,
	results: SearchResult[],
	topK: number,
	apiKey: string,
): Promise<SearchResult[]> {
	if (results.length === 0) {
		return results
	}

	try {
		const client = new VoyageAIClient({ apiKey })
		const response = await client.rerank({
			query,
			documents: results.map((r) => r.text),
			model: 'rerank-2',
			topK,
		})

		const data = response.data ?? []

		return data
			.filter((item) => item.index !== undefined)
			.map((item) => {
				const original = results[item.index as number]
				if (!original) return null
				return { ...original, score: item.relevanceScore ?? original.score }
			})
			.filter((result): result is SearchResult => result !== null)
	} catch {
		return results
	}
}
