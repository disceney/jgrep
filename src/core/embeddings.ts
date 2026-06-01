import { VoyageAIClient } from 'voyageai'

const BATCH_SIZE = 128

export async function embedTexts(texts: string[], model: string): Promise<number[][]> {
	const apiKey = process.env['VOYAGE_API_KEY']
	if (!apiKey) {
		throw new Error('VOYAGE_API_KEY environment variable is not set')
	}

	const client = new VoyageAIClient({ apiKey })
	const results: number[][] = new Array(texts.length)

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE)
		const response = await client.embed({ input: batch, model, inputType: 'document' })
		const data = response.data ?? []
		for (let j = 0; j < data.length; j++) {
			results[i + j] = data[j]?.embedding ?? []
		}
	}

	return results
}

export async function embedQuery(text: string, model: string): Promise<number[]> {
	const apiKey = process.env['VOYAGE_API_KEY']
	if (!apiKey) throw new Error('VOYAGE_API_KEY environment variable is not set')
	const client = new VoyageAIClient({ apiKey })
	const response = await client.embed({ input: [text], model, inputType: 'query' })
	return response.data?.[0]?.embedding ?? []
}
