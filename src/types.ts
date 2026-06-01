export interface FgrepConfig {
	model: string
	topK: number
	chunkSize: number
	overlap: number
	minScore: number
	voyageApiKey?: string
	rerank?: boolean
	rerankCandidates?: number
	hybridSearch?: boolean
	chunkStrategy?: 'lines' | 'smart'
	maxPerFile?: number
	maxChunksPerFile?: number
	maxFileSizeKb?: number
}

export interface Chunk {
	file: string
	startLine: number
	endLine: number
	text: string
	lang: string
}

export interface IndexedChunk extends Chunk {
	embedding: number[]
}

export interface IndexData {
	model: string
	fileCount: number
	chunkCount: number
}

export interface SearchResult {
	file: string
	startLine: number
	endLine: number
	score: number
	text: string
	lang: string
}

export interface SearchOptions {
	topK?: number
	minScore?: number
	langs?: string[]
}

export type OutputFormat = 'pretty' | 'json'
