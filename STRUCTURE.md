| File | Description | LastModified | Hash |
|------|-------------|--------------|------|
| `.eslintrc.json` | ESLint configuration — TypeScript parser, recommended rules, Node.js environment with ES2022 support | 2026-06-01 09:04 | bf56aad7630e0a6a |
| `.prettierrc.json` | Prettier config — tabs, single quotes, trailing commas, 100-char line width | 2026-06-01 09:04 | 8a3dc820dcfc9307 |
| `README.md` | jgrep CLI — lightweight semantic search via Voyage AI embeddings and LanceDB, hybrid matching with cosinus similarity and BM25 | 2026-06-01 10:21 | cd57d9e9f29c1ed5 |
| `package.json` | jgrep npm package — semantic code search CLI using Voyage AI embeddings and LanceDB vector database | 2026-06-01 09:04 | 9080b8d8cd598b3a |
| `src/cli.ts` | CLI entry point—registers index, search, and install commands with Commander, validates initialization via .jgreprc | 2026-06-01 10:04 | 1a8d65486abb42fd |
| `src/commands/index.ts` | Index command — builds and watches code corpus with incremental embedding, debounced file monitoring, formatted progress output | 2026-06-01 10:21 | d280f9628847c3b9 |
| `src/commands/install.ts` | Install command — initializes .jgreprc config, .jgrep directory, LanceDB table, and updates .gitignore with jgrep markers | 2026-06-01 10:04 | 348f5c76dbfcaae2 |
| `src/commands/search.ts` | Search command — queries embeddings index with filters, returns formatted results as JSON or pretty table | 2026-06-01 10:04 | eabae31ae9995a1f |
| `src/core/chunker.ts` | Chunker — splits file content into overlapping chunks with line-based and smart boundary-aware segmentation | 2026-06-01 10:04 | 3b3c48ecaa020d23 |
| `src/core/config.ts` | Manages jgrep configuration — loads .jgreprc with defaults, merges exclude patterns, sets search and chunking parameters | 2026-06-01 10:21 | 348e5be2d370b3ac |
| `src/core/embeddings.ts` | Embeddings module — wraps VoyageAI client for batch document and query embedding generation with API key resolution | 2026-06-01 10:04 | ee70bb443e4964d6 |
| `src/core/indexer.ts` | Incremental indexing engine — chunks files, detects language, embeds via Voyage API, manages FTS index with hash-based deduplication | 2026-06-01 10:21 | cb39c4a0ba30a443 |
| `src/core/lang.ts` | Language detection utility — maps file extensions to syntax highlighting language codes with fallback to text | 2026-06-01 09:04 | 21504aa6d67f4759 |
| `src/core/reranker.ts` | Reranks search results using Voyage AI client with relevance scoring, returns top-K matches or fallback original results | 2026-06-01 10:04 | dfabed81f0f9ea87 |
| `src/core/search.ts` | Hybrid search engine — combines dense vector and BM25 full-text search with RRF fusion, optional reranking, language filtering | 2026-06-01 10:04 | 3b9540a2847031de |
| `src/core/store.ts` | LanceDB vector store adapter — manages chunked code indexing with Arrow schema, FTS, and file hash tracking | 2026-06-01 10:04 | f11344b6dea8fd69 |
| `src/core/walker.ts` | File traversal utility — uses globby to resolve include/exclude patterns with gitignore support | 2026-06-01 10:21 | 9c9ad5b6ffc6853d |
| `src/output/formatter.ts` | Formats search results as JSON or colored plaintext output with optional text filtering | 2026-06-01 10:04 | 60f6ec45c14628fc |
| `src/types.ts` | TypeScript interfaces for semantic code search — FgrepConfig, Chunk, IndexedChunk, SearchResult, SearchOptions, OutputFormat | 2026-06-01 10:21 | bc58533370c3ba0c |
| `tsconfig.json` | TypeScript compiler config—ES2022 target, NodeNext module resolution, strict mode, src-to-dist build setup | 2026-06-01 09:04 | 4668a012425bc705 |
