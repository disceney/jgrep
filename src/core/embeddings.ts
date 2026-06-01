import { VoyageAIClient } from 'voyageai'

const BATCH_SIZE = 128
const MAX_CONCURRENT_BATCHES = 3

export async function embedTexts(
	texts: string[],
	model: string,
	apiKey?: string,
): Promise<number[][]> {
	const resolvedApiKey = process.env['VOYAGE_API_KEY'] || apiKey
	if (!resolvedApiKey) {
		throw new Error('VOYAGE_API_KEY environment variable is not set')
	}

	const client = new VoyageAIClient({ apiKey: resolvedApiKey })
	const results: number[][] = new Array(texts.length)

	const batches: Array<{ start: number; texts: string[] }> = []
	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		batches.push({ start: i, texts: texts.slice(i, i + BATCH_SIZE) })
	}

	// Process batches with bounded concurrency
	for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
		const window = batches.slice(i, i + MAX_CONCURRENT_BATCHES)
		await Promise.all(
			window.map(async ({ start, texts: batch }) => {
				const response = await client.embed({ input: batch, model, inputType: 'document' })
				const data = response.data ?? []
				for (let j = 0; j < data.length; j++) {
					results[start + j] = data[j]?.embedding ?? []
				}
			}),
		)
	}

	return results
}

export async function embedQuery(text: string, model: string, apiKey?: string): Promise<number[]> {
	const resolvedApiKey = process.env['VOYAGE_API_KEY'] || apiKey
	if (!resolvedApiKey) throw new Error('VOYAGE_API_KEY environment variable is not set')
	const client = new VoyageAIClient({ apiKey: resolvedApiKey })
	const response = await client.embed({ input: [text], model, inputType: 'query' })
	return response.data?.[0]?.embedding ?? []
}
