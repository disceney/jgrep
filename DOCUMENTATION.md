# DOCUMENTATION.md

<meta>
  <name>jgrep</name>
  <version>1.0</version>
  <last_updated>2026-06-01 10:57</last_updated>
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
    <description>Orchestration CLI exposant la construction incrémentale d'index avec surveillance temps réel et la recherche sémantique sur embeddings avec filtrage par langue.</description>
    <chain>
      <layer name="Controllers">indexCommand orchestre la marche à pied, construction incrémentale, watch mode, debounce et callbacks de progression., searchCommand charge config, intègre requête, interroge index, formate résultats avec filtrage langues optionnel.</layer>
    </chain>
    <relations>
      <relation>core</relation>
    </relations>
  </domain>

  <domain name="core">
    <description>Moteur vectoriel qui indexe les fichiers, fragmente le contenu, génère des embeddings et exécute des recherches par similarité sémantique.</description>
    <chain>
      <layer name="Entity">Chunker divise le contenu en fragments de lignes avec chevauchement configurable, Language detector mappe les extensions vers les codes de coloration syntaxique, Embeddings Voyage AI génère les vecteurs de document et requête par lot, File walker résout les motifs include/exclude avec support gitignore</layer>
      <layer name="Repository">LanceDB vector store upsère les fragments indexés avec embeddings, supprime par fichier, persiste les tables</layer>
      <layer name="Controllers">Config loader fusionne fichier .jgreprc avec defaults de modèle et chunking, Incremental indexer détecte changements par hash, traite seulement les fichiers modifiés, upsère les chunks vectorisés, searchIndex fonction effectue recherche par similarité cosinus, filtrage langue, seuillage score</layer>
    </chain>
    <relations>
      <relation>commands</relation>
      <relation>src</relation>
    </relations>
  </domain>

  <domain name="src">
    <description>Couche de présentation exposant l'interface CLI pour indexer et interroger la base sémantique de code.</description>
    <chain>
      <layer name="Entity">FgrepConfig configure inclusion/exclusion et paramétrages d'embedding et scoring., Chunk et IndexedChunk structurent segments de source avec métadonnées fichier et vecteurs., SearchResult encapsule le score et la position du résultat pour l'utilisateur., SearchOptions agrègent filtres langue et seuils requête., OutputFormat énumère variantes de formatage (JSON, pretty-print).</layer>
      <layer name="Controllers">CLI programme Commander expose commandes index (incremental watch) et search (requête textuelle)., indexCommand délègue la construction/mise à jour d'index sémantique., searchCommand exécute requête filtrée et formate réponses.</layer>
    </chain>
    <relations>
      <relation>commands</relation>
      <relation>core</relation>
    </relations>
  </domain>
</domains>

<architecture>
  <stack>Node.js 18+ TypeScript CLI using Voyage AI embeddings with LanceDB vector store and Commander CLI framework.</stack>
  <directories>
    <directory name="src/" purpose="Moteur de recherche sémantique : point d'entrée CLI, handlers commandes, chunking, embeddings, indexation."/>
  </directories>
  <patterns>
    <pattern>ES modules avec strict mode TypeScript</pattern>
    <pattern>Voyage AI pour génération embeddings</pattern>
    <pattern>LanceDB comme vecteur base de données</pattern>
    <pattern>Globbing avec .gitignore respect</pattern>
  </patterns>
  <integrations>
    <integration>Voyage AI (embeddings)</integration>
    <integration>LanceDB (stockage vectoriel)</integration>
    <integration>Commander (CLI parsing)</integration>
    <integration>Globby (fichiers traversal)</integration>
  </integrations>
</architecture>
