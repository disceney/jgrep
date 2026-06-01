| File | Description | LastModified | Hash |
|------|-------------|--------------|------|
| `.eslintrc.json` | ESLint configuration — TypeScript parser, recommended rules, Node.js environment with ES2022 support |  | bf56aad7630e0a6a |
| `.prettierrc.json` | Prettier config — tabs, single quotes, trailing commas, 100-char line width |  | 8a3dc820dcfc9307 |
| `README.md` | jgrep CLI — semantic search tool using Voyage AI embeddings for codebase indexing and cosine similarity queries |  | 283121753e359409 |
| `package.json` | jgrep npm package — semantic code search CLI using Voyage AI embeddings and LanceDB vector database |  | 9080b8d8cd598b3a |
| `src/cli.ts` | CLI entry point — defines jgrep index and search commands with options, delegates to command handlers |  | b40b97d365d84395 |
| `src/commands/index.ts` | Index command — builds incremental embeddings with watch mode, progress callbacks, debounced rebuilds |  | 53ad4fdd0c0bf0b0 |
| `src/commands/search.ts` | Search command — loads config, embeds query, searches index, returns formatted results with language filtering |  | f0ac2a36ad7475e1 |
| `src/core/chunker.ts` | Chunkfile function — splits file content into overlapping line-based chunks with configurable size and stride |  | d4b2c1baa78e6414 |
| `src/core/config.ts` | Config loader and defaults — reads .jgreprc file, merges with hardcoded defaults for embeddings model, chunking, and exclude patterns |  | a523afcf5fb62d35 |
| `src/core/embeddings.ts` | Voyage AI embeddings service — generates document and query embeddings with batch processing, VOYAGE_API_KEY required |  | 31d883b0290ffcae |
| `src/core/indexer.ts` | Incremental index builder — chunks files, detects language, embeds text, upserts vectorized chunks into store with hash-based deduplication |  | d8d7eac42f27975b |
| `src/core/lang.ts` | Language detection utility — maps file extensions to syntax highlighting language codes with fallback to text |  | 21504aa6d67f4759 |
| `src/core/search.ts` | searchIndex function — vector similarity search with cosine distance, language filters, score thresholding |  | 5ff19f48060096b1 |
| `src/core/store.ts` | LanceDB vector store operations — opens/creates table, upserts indexed chunks with embeddings, deletes by file, retrieves file hashes and statistics |  | 350d24b7442a7d86 |
| `src/core/walker.ts` | File traversal utility — uses globby to resolve include/exclude patterns with gitignore support |  | 9c9ad5b6ffc6853d |
| `src/output/formatter.ts` | Formats search results as JSON or colored plain text with file location and relevance score |  | 2840f97e181b3b16 |
| `src/types.ts` | TypeScript interfaces for semantic code search: FgrepConfig settings, Chunk/IndexedChunk structures, SearchResult output, SearchOptions filters, OutputFormat variants |  | 9e382ce37a308350 |
| `tsconfig.json` | TypeScript compiler config—ES2022 target, NodeNext module resolution, strict mode, src-to-dist build setup |  | 4668a012425bc705 |
