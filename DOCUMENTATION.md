# DOCUMENTATION.md

<meta>
  <name>jgrep</name>
  <version>1.0</version>
  <last_updated>2026-06-01 14:28</last_updated>
</meta>

<summary>
jgrep est un outil CLI en TypeScript qui permet de rechercher du code par intention sémantique plutôt que par correspondance de mots-clés. Il indexe un codebase en générant des embeddings vectoriels via Voyage AI, stockés dans une base LanceDB locale. La recherche s'effectue en langage naturel : l'outil calcule la similarité cosinus entre la requête et les chunks indexés pour retourner les passages les plus pertinents. Il s'adresse aux développeurs power-users travaillant en ligne de commande, qui souhaitent retrouver rapidement du code à partir de sa signification fonctionnelle. Là où grep s'arrête aux correspondances textuelles, jgrep comprend le sens des requêtes.
</summary>

<identity>
  <name>jgrep</name>
  <problem>grep classique rate les synonymes et variantes sémantiques — jgrep permet de retrouver du code en décrivant ce qu'il fait, par intention plutôt que par mot-clé</problem>
  <audience>Développeurs CLI et power-users à l'aise avec le terminal, qui veulent explorer un codebase rapidement</audience>
  <value_proposition>Recherche par sens plutôt que par syntaxe : contrairement à grep/ripgrep, jgrep comprend l'intention derrière une requête en langage naturel grâce aux embeddings vectoriels Voyage AI</value_proposition>
</identity>

<domains>
  <domain name="commands">
    <description>Orchestre les quatre commandes CLI principales — installation, indexation avec surveillance, recherche sémantique et mise à jour auto.</description>
    <chain>
      <layer name="Controllers">Index command : indexation incrémentale avec reconstruction debounced sur changements fichiers et rapport de progression., Install command : initialise la configuration projet, crée le répertoire .jgrep, initialise LanceDB et met à jour .gitignore., Search command : exécute la recherche sémantique avec filtrage par langage, génération d'embeddings et formatage résultat., Update command : récupère les versions GitHub, affiche le diff, installe la dernière version via npm globalement.</layer>
    </chain>
    <relations>
      <relation>core</relation>
      <relation>src</relation>
    </relations>
  </domain>

  <domain name="core">
    <description>Cœur d'indexation et recherche sémantique — segmente les fichiers, génère embeddings, stocke dans LanceDB, et fusionne recherche dense + BM25 avec déduplication.</description>
    <chain>
      <layer name="Entity">Configuration defaults (chunking, embedding, reranking, file limits) et types d'index, Détection de langue mappant extensions aux highlighters de syntaxe, Résultats de recherche fusionnés (score RRF, déduplication par fichier, filtrage overlap)</layer>
      <layer name="Controllers">Indexeur incrémental — parcourt fichiers, applique stratégie chunking, détecte changements SHA1, génère embeddings, upsert LanceDB, Orchestration recherche hybride — vecteurs denses + BM25, RRF fusion, réranking optionnel, filtrage minScore, Chunker à fenêtrage fixe (chunkFile) et boundary-aware (chunkFileSmart) pour segmentation sémantique, Client embeddings Voyage AI — batching avec contrôle de concurrence, Reranker Voyage AI — rescoring et top-K fallback, Opérations LanceDB — upsert chunks, FTS index, recherche full-text avec Arrow schema, Parcourir fichiers — filtrage glob, ignorer binaires, respecter gitignore</layer>
      <layer name="Forms">Configuration loader et validation FgrepConfig</layer>
    </chain>
    <relations>
      <relation>commands</relation>
    </relations>
  </domain>

  <domain name="src">
    <description>Point d'entrée CLI et contrats de type pour orchestrer l'indexation sémantique, la recherche, et l'installation du projet jgrep.</description>
    <chain>
      <layer name="Entity">FgrepConfig : configuration globale du modèle, tokenization, filtrage et scoring, Chunk : fragment de code source avec ligne, langue et texte brut, IndexedChunk : chunk augmenté de son embedding vectoriel pour le calcul de similarité, SearchResult : résultat de requête avec score de pertinence et métadonnées de localisation, SearchOptions : paramètres d'affinement de recherche (topK, minScore, langues), OutputFormat : format de sortie (pretty ou JSON)</layer>
      <layer name="Controllers">CLI : ligne de commande Commander exposant index, search, install, update avec vérification d'initialisation .jgreprc, indexCommand : construction ou mise à jour incrémentale de l'index en mode watch, searchCommand : exécution de requête sémantique avec filtrage optionnel et formatage custom, installCommand : initialisation du projet et stockage de la clé Voyage AI, updateCommand : vérification et installation des nouvelles versions</layer>
    </chain>
    <relations>
      <relation>commands</relation>
      <relation>core</relation>
    </relations>
  </domain>
</domains>

<architecture>
  <stack>Node.js 18+ CLI tool with TypeScript, LanceDB vector store, and Voyage AI embeddings for semantic code search.</stack>
  <directories>
    <directory name="src/" purpose="CLI entry point, commands, and core search logic modules"/>
    <directory name=".github/" purpose="GitHub Actions workflows for automated releases"/>
  </directories>
  <patterns>
    <pattern>Single CLI entry point (cli.ts)</pattern>
    <pattern>LanceDB for vector persistence</pattern>
    <pattern>Voyage AI embeddings integration</pattern>
    <pattern>Module-based architecture (chunker, indexer, search, reranker)</pattern>
  </patterns>
  <integrations>
    <integration>Voyage AI API for embeddings</integration>
    <integration>LanceDB vector database</integration>
    <integration>Commander for CLI framework</integration>
    <integration>Globby for file globbing</integration>
    <integration>Ignore for .gitignore processing</integration>
  </integrations>
</architecture>
