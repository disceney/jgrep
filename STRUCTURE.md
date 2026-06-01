| File | Description | LastModified | Hash |
|------|-------------|--------------|------|
| `.eslintrc.json` | ESLint configuration — TypeScript parser, recommended rules, Node.js environment with ES2022 support | 2026-06-01 09:04 | bf56aad7630e0a6a |
| `.github/workflows/release.yml` | Release automation workflow — builds npm package on tag push, extracts changelog notes, publishes GitHub release with tarball | 2026-06-01 12:21 | ce8c92043dd197d3 |
| `.prettierrc.json` | Prettier config — tabs, single quotes, trailing commas, 100-char line width | 2026-06-01 09:04 | 8a3dc820dcfc9307 |
| `README.md` | jgrep CLI documentation — lightweight semantic code search tool using Voyage AI embeddings and LanceDB, with installation, configuration, usage and architecture | 2026-06-01 12:21 | 437af35da44d8b24 |
| `install.sh` | Bash installer script — checks Node.js ≥18, resolves release version from GitHub API, globally installs jgrep tarball via npm | 2026-06-01 12:21 | 20b495fecf8614df |
| `package.json` | jgrep npm package — semantic code-search CLI using Voyage AI embeddings and LanceDB, exports bin entry, defines build/dev/lint scripts | 2026-06-01 12:21 | 75d20467b3eb10ae |
| `src/cli.ts` | CLI entry point — defines commands (index, search, install, update) with options parsing via Commander, checks .jgreprc initialization | 2026-06-01 12:21 | 13a62efafaeca7de |
| `src/commands/index.ts` | Index command — incremental indexing with file watch, progress reporting, debounced rebuilds on filesystem changes | 2026-06-01 11:49 | c9f81d02ae14d4ed |
| `src/commands/install.ts` | Install command — initializes .jgreprc with project-type detection, creates .jgrep directory, initializes LanceDB, updates .gitignore | 2026-06-01 12:10 | 9de3017ea803affa |
| `src/commands/search.ts` | Search command — executes semantic code search with language filtering, embedding generation, and formatted output display | 2026-06-01 12:10 | 694ad3f144a7008d |
| `src/commands/update.ts` | Update command — fetches GitHub releases, compares versions, displays changelog snippet, installs latest via npm globally | 2026-06-01 12:21 | fea01b86416de6f6 |
| `src/core/chunker.ts` | Splits source files into overlapping chunks using line-based windowing; chunkFile for fixed-size chunks, chunkFileSmart for boundary-aware semantic chunking with function/class/tag detection | 2026-06-01 11:49 | 3edf7e1ea6df04d4 |
| `src/core/config.ts` | Default config and loader for FgrepConfig — model, embedding params, chunking strategy, reranking, file limits | 2026-06-01 11:49 | a54c930efbf37f9b |
| `src/core/embeddings.ts` | Voyage AI embedding client — generates document and query embeddings with batching, bounded concurrency control | 2026-06-01 12:21 | beba2ae26a010fcb |
| `src/core/indexer.ts` | Incremental indexer — walks files, chunks by strategy (smart/regular), detects changes via SHA1 hash, embeds texts with Voyage AI, upserts LanceDB storage | 2026-06-01 12:21 | fe76d0c81fc38bfa |
| `src/core/lang.ts` | Language detection utility — maps file extensions to syntax highlight languages, fallback to text | 2026-06-01 12:10 | 1e81ba60ff2ce81c |
| `src/core/reranker.ts` | Reranks search results using Voyage AI client with relevance scoring, returns top-K matches or fallback original results | 2026-06-01 10:04 | dfabed81f0f9ea87 |
| `src/core/search.ts` | Semantic search orchestration — hybrid dense vector + BM25 retrieval, RRF fusion with cosine scoring, deduplication and chunk overlap filtering | 2026-06-01 12:21 | 29d1cf76c5eece5f |
| `src/core/store.ts` | LanceDB vector store operations — openTable, upsertChunks, deleteChunksForFile, getFileHashes, getStats, createFTSIndex, fullTextSearch with Arrow schema | 2026-06-01 11:49 | 0179f069ec820848 |
| `src/core/walker.ts` | File walker — filters files by glob patterns, ignores binaries and lock files, respects gitignore | 2026-06-01 12:21 | e57b8dd512749b82 |
| `src/output/formatter.ts` | Formats search results as JSON or colored plaintext output with optional text filtering | 2026-06-01 10:04 | 60f6ec45c14628fc |
| `src/types.ts` | TypeScript type definitions for jgrep — FgrepConfig, Chunk, IndexedChunk, SearchResult interfaces and OutputFormat union | 2026-06-01 12:10 | e8ec32adfad4bca9 |
| `tsconfig.json` | TypeScript compiler config—ES2022 target, NodeNext module resolution, strict mode, src-to-dist build setup | 2026-06-01 09:04 | 4668a012425bc705 |
| `tsup.config.ts` | Tsup build configuration — bundles CLI entry point as ESM with version and repo constants | 2026-06-01 12:21 | 04cd2685ec5fc4e2 |
