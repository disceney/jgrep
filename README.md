# jgrep

`jgrep` est un CLI de recherche sémantique léger qui indexe votre base de code via les embeddings [Voyage AI](https://www.voyageai.com/) et répond à des requêtes en langage naturel — une alternative allégée à `mgrep`, sans infrastructure de recherche externe.

Les vecteurs sont stockés dans une base [LanceDB](https://lancedb.github.io/lancedb/) embarquée (`.jgrep/`). La recherche combine similarité cosinus, BM25 full-text et re-ranking Voyage AI. Aucun serveur, aucune base de données externe.

## Table des matières

- [Installation](#installation)
  - [Prérequis](#prérequis)
  - [Installation en une ligne](#installation-en-une-ligne)
  - [Version spécifique](#version-spécifique)
  - [Mise à jour](#mise-à-jour)
- [Démarrage rapide](#démarrage-rapide)
- [Configuration](#configuration)
  - [Variable d'environnement](#variable-denvironnement)
  - [Fichier .jgreprc](#fichier-jgreprc)
  - [Référence des options](#référence-des-options)
- [Utilisation](#utilisation)
  - [Indexer le projet](#indexer-le-projet)
  - [Rechercher](#rechercher)
- [Modes avancés](#modes-avancés)
- [Fonctionnement](#fonctionnement)
- [Utilisation machine / agent](#utilisation-machine--agent)
- [Architecture](#architecture)

---

## Installation

### Prérequis

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- **Clé API Voyage AI** — [voyageai.com](https://www.voyageai.com/) (gratuit pour démarrer)

### Installation en une ligne

```bash
curl -fsSL https://raw.githubusercontent.com/disceney/jgrep/main/install.sh | bash
```

Le script vérifie la version de Node.js, télécharge la dernière release depuis GitHub et installe le binaire globalement via `npm install -g`.

### Version spécifique

```bash
curl -fsSL https://raw.githubusercontent.com/disceney/jgrep/main/install.sh | bash -s -- v0.2.0
```

### Mise à jour

```bash
jgrep update           # installe la dernière version
jgrep update --check   # vérifie sans installer
```

---

## Démarrage rapide

`jgrep install` est **la première commande à exécuter** dans chaque projet que vous souhaitez indexer. Elle initialise l'environnement local et bloque `jgrep index` et toute recherche tant qu'elle n'a pas été lancée.

```bash
cd /path/to/your-project
jgrep install --api-key vo_xxxxxxxxxxxxxxxx
```

`jgrep install` réalise automatiquement les opérations suivantes :

1. **Détecte le type de projet** (Symfony, Node.js, Rust, Go, Python) et génère un `.jgreprc` avec les exclusions adaptées.
2. **Crée `.jgreprc`** à la racine du projet avec la configuration par défaut.
3. **Crée le répertoire `.jgrep/`** qui hébergera la base LanceDB.
4. **Initialise la table LanceDB** dans `.jgrep/`.
5. **Met à jour `.gitignore`** en y ajoutant le bloc suivant (créé s'il n'existe pas) :

```
###> jgrep ###
/.jgrep/
/.jgreprc
###< jgrep ###
```

> **Note :** si `.jgreprc` existe déjà, la commande s'arrête sans écraser. Utilisez `--force` pour forcer le remplacement.

Puis indexez et cherchez :

```bash
jgrep index
jgrep "où est gérée l'authentification ?"
```

---

## Configuration

### Variable d'environnement

`jgrep` utilise la clé API Voyage AI pour générer les embeddings et le re-ranking. Elle peut être fournie via la variable d'environnement :

```bash
export VOYAGE_API_KEY=vo_xxxxxxxxxxxxxxxx
```

Ajoutez cette ligne à votre `~/.zshrc` ou `~/.bashrc` pour ne pas avoir à la redéfinir à chaque session.

La variable d'environnement a **priorité** sur l'option `voyageApiKey` du `.jgreprc`.

### Fichier .jgreprc

Après `jgrep install`, un `.jgreprc` est créé à la racine du projet. Exemple pour un projet Symfony :

```json
{
	"exclude": ["vendor/**", "var/**", "public/bundles/**", "public/build/**"],
	"model": "voyage-code-3",
	"topK": 10,
	"chunkSize": 40,
	"overlap": 10,
	"minScore": 0.3,
	"voyageApiKey": "",
	"rerank": true,
	"rerankCandidates": 30,
	"hybridSearch": true,
	"chunkStrategy": "smart",
	"maxPerFile": 2
}
```

### Référence des options

| Option             | Type                   | Défaut            | Description                                                                                |
| ------------------ | ---------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `model`            | `string`               | `"voyage-code-3"` | Modèle d'embedding Voyage AI                                                               |
| `topK`             | `number`               | `10`              | Nombre de résultats retournés par défaut                                                   |
| `chunkSize`        | `number`               | `40`              | Nombre de lignes par chunk                                                                 |
| `overlap`          | `number`               | `10`              | Lignes de recouvrement entre deux chunks adjacents                                         |
| `minScore`         | `number`               | `0.3`             | Score minimum (0–1) — filtre les résultats non pertinents                                  |
| `voyageApiKey`     | `string`               | `""`              | Clé API Voyage AI (fallback si `VOYAGE_API_KEY` non défini dans l'environnement)           |
| `rerank`           | `boolean`              | `true`            | Active le re-ranking via Voyage Rerank après la recherche vectorielle                      |
| `rerankCandidates` | `number`               | `30`              | Nombre de candidats récupérés avant re-ranking (doit être ≥ `topK`)                        |
| `hybridSearch`     | `boolean`              | `true`            | Active la recherche hybride (vecteurs + BM25 full-text avec fusion RRF)                    |
| `chunkStrategy`    | `"lines"` \| `"smart"` | `"smart"`         | `lines` : fenêtre fixe ; `smart` : respect des frontières sémantiques (fonctions, classes) |
| `maxPerFile`       | `number`               | `2`               | Nombre maximum de chunks retournés par fichier — évite qu'un seul fichier domine           |
| `maxChunksPerFile` | `number`               | `80`              | Limite le nombre de chunks indexés par fichier (utile pour les très grands fichiers)       |
| `maxFileSizeKb`    | `number`               | `512`             | Ignore les fichiers dépassant cette taille (en Ko)                                         |
| `include`          | `string[]`             | `["**/*"]`        | Patterns glob des fichiers à indexer                                                       |
| `exclude`          | `string[]`             | `[]`              | Patterns glob des fichiers à exclure (en plus des exclusions automatiques)                 |

> **Exclusions automatiques** : `.jgrep/`, `.git/`, fichiers binaires, lock files (`*.lock`, `package-lock.json`, `composer.lock`, `yarn.lock`, `bun.lockb`), assets minifiés (`*.min.js`, `*.min.css`), source maps (`*.map`), `config/reference.php` (fichier Symfony auto-généré). Le `.gitignore` du projet est également respecté.

---

## Utilisation

### Indexer le projet

Depuis la racine du projet à indexer (après `jgrep install`) :

```bash
jgrep index
```

Les fichiers inchangés sont réutilisés depuis la base LanceDB (`.jgrep/`) via leur hash SHA-1 — seuls les fichiers nouveaux ou modifiés sont ré-embeddés. Un index BM25 full-text est automatiquement mis à jour après chaque indexation.

Pour re-indexer automatiquement à chaque modification de fichier :

```bash
jgrep index --watch
```

### Rechercher

```bash
jgrep "votre requête en langage naturel"
```

Exemples :

```bash
jgrep "où est gérée l'authentification ?"
jgrep "comment sont envoyés les emails ?"
jgrep "gestion des erreurs dans le contrôleur"
```

**Options disponibles :**

| Option            | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `--json`          | Sortie au format JSON (pour scripts / piping / agents)               |
| `--compact`       | JSON sans le texte des chunks — uniquement fichier, lignes et score  |
| `--topK <N>`      | Nombre de résultats à retourner (écrase `topK` du `.jgreprc`)        |
| `--lang <list>`   | Filtre par langage(s), séparés par virgule — voir tableau ci-dessous |
| `--min-score <n>` | Score minimum (0–1), écrase `minScore` du `.jgreprc`                 |

```bash
jgrep "stockage des embeddings" --topK 5
jgrep "gestion des exceptions" --json
jgrep "routes API" --lang ts,php --topK 3
jgrep "kernel symfony" --json --compact          # pour les agents IA
jgrep "authentification" --min-score 0.6         # résultats très pertinents seulement
```

**Langages supportés par `--lang` :**

Les noms complets et les alias courts sont acceptés :

| Alias  | Nom complet  | Extensions indexées |
| ------ | ------------ | ------------------- |
| `php`  | `php`        | `.php`              |
| `ts`   | `typescript` | `.ts`, `.tsx`       |
| `js`   | `javascript` | `.js`, `.jsx`       |
| `py`   | `python`     | `.py`               |
| `rb`   | `ruby`       | `.rb`               |
| `rs`   | `rust`       | `.rs`               |
| `go`   | `go`         | `.go`               |
| `java` | `java`       | `.java`             |
| `cs`   | `csharp`     | `.cs`               |
| `sh`   | `shell`      | `.sh`               |
| `md`   | `markdown`   | `.md`               |
| `twig` | `twig`       | `.twig`             |
| `html` | `html`       | `.html`             |
| `css`  | `css`        | `.css`              |
| `yaml` | `yaml`       | `.yaml`, `.yml`     |
| `json` | `json`       | `.json`             |
| `sql`  | `sql`        | `.sql`              |
| `vue`  | `vue`        | `.vue`              |

```bash
jgrep "composant navbar" --lang twig
jgrep "hook useEffect" --lang ts
jgrep "migration schema" --lang php,yaml
```

---

## Modes avancés

Les défauts de jgrep (`hybridSearch: true`, `rerank: true`, `chunkStrategy: "smart"`) sont calibrés pour la précision maximale. Voici comment les adapter selon le contexte.

### Cas 1 — Projet PHP legacy (fichiers longs, code hétérogène)

Les fichiers PHP legacy mélangent souvent PHP, HTML et JavaScript dans le même fichier, avec de longues méthodes. La stratégie `smart` respecte les frontières de blocs ; augmentez `rerankCandidates` pour élargir le pool avant re-ranking.

```json
{
	"chunkStrategy": "smart",
	"rerank": true,
	"rerankCandidates": 50,
	"hybridSearch": true,
	"maxPerFile": 3
}
```

### Cas 2 — Petit projet (< 50 fichiers, usage intensif par agents IA)

Sur un petit corpus, le re-ranking et la recherche hybride ajoutent de la latence sans gain significatif. Désactivez-les pour accélérer les recherches en boucle.

```json
{
	"chunkStrategy": "smart",
	"rerank": false,
	"hybridSearch": false
}
```

### Cas 3 — Monorepo Symfony / React (vocabulaire mixte, rappel important)

Un monorepo mêle TypeScript, PHP et des noms de composants qui ne sont pas toujours couverts par la seule similarité sémantique. La recherche hybride (vecteurs + BM25) améliore le rappel sur les termes exacts ; le re-ranking réordonne ensuite les candidats. Augmentez `topK` et `maxPerFile` pour couvrir la surface.

```json
{
	"hybridSearch": true,
	"rerank": true,
	"rerankCandidates": 40,
	"topK": 15,
	"maxPerFile": 3
}
```

---

## Fonctionnement

1. **Initialisation** — `jgrep install` détecte le type de projet, crée `.jgreprc` avec des exclusions adaptées, initialise la base LanceDB dans `.jgrep/` et met à jour `.gitignore`.
2. **Découverte** — `jgrep index` parcourt les fichiers selon les patterns `include`/`exclude` du `.jgreprc`, en respectant le `.gitignore`. Les répertoires `.jgrep/` et `.git/`, les fichiers binaires, les lock files et les assets minifiés sont exclus en dur.
3. **Chunking** — chaque fichier est découpé selon la stratégie choisie :
   - `lines` : fenêtre glissante de `chunkSize` lignes avec `overlap` de recouvrement.
   - `smart` : même mécanique mais le split préfère les frontières sémantiques (fonctions, classes, méthodes, balises HTML, blocs Twig) détectées par regex. Un fichier qui tient en un seul chunk n'est pas fragmenté davantage.
4. **Embedding** — les chunks nouveaux ou modifiés sont envoyés à l'API Voyage AI (`voyage-code-3`) en lots. Les fichiers inchangés (même hash SHA-1) sont réutilisés depuis la base.
5. **Index** — vecteurs et métadonnées sont persistés dans LanceDB ; un index BM25 full-text est recréé sur la colonne `text` après chaque upsert.
6. **Recherche** — la requête est embeddée à la volée, puis :
   - **Dense** (toujours) : similarité cosinus contre les vecteurs stockés, `topK × 5` candidats.
   - **Filtre qualité cosinus** : les candidats dont la similarité cosinus est trop faible sont éliminés avant le re-ranking, rendant `minScore` efficace même avec le reranker.
   - **BM25** (si `hybridSearch: true`) : recherche plein texte sur l'index FTS, même nombre de candidats.
   - **Fusion RRF** (si hybride) : les deux listes sont fusionnées par Reciprocal Rank Fusion, scores normalisés sur [0, 1].
   - **Re-ranking** (si `rerank: true` et clé API disponible) : les `rerankCandidates` meilleurs candidats sont envoyés à Voyage Rerank ; les scores `relevanceScore` remplacent les scores RRF/cosinus.
7. **Résultats** — filtre `minScore`, déduplication à `maxPerFile` chunks par fichier (les chunks qui se chevauchent avec un chunk déjà inclus sont ignorés), retour des `topK` meilleurs.

---

## Utilisation machine / agent

Toutes les commandes `jgrep` supportent une sortie entièrement machine-readable.

### Recherche compacte pour agents

```bash
jgrep "authentification utilisateur" --json --compact
```

Retourne un tableau JSON minimal (sans le texte des chunks) :

```json
[
	{
		"file": "src/Security/Authenticator.php",
		"lang": "php",
		"startLine": 12,
		"endLine": 51,
		"score": 0.87
	}
]
```

Retourne `[]` si aucun résultat ne dépasse `minScore`.

### Recherche complète

```bash
jgrep "authentification utilisateur" --json
```

Même structure avec un champ `text` supplémentaire contenant le code source du chunk.

### Codes de sortie

| Code | Signification                                                   |
| ---- | --------------------------------------------------------------- |
| `0`  | Succès — résultats retournés (ou index construit avec succès)   |
| `1`  | Erreur — projet non initialisé, clé API manquante, autre erreur |

### Prérequis pour les agents

`jgrep install` est la **porte d'entrée obligatoire**. Si `.jgreprc` est absent, toute commande `jgrep index` ou `jgrep <query>` termine avec le code `1` et écrit sur stderr :

```
Error: jgrep is not initialized. Run `jgrep install` first.
```

Séquence d'initialisation recommandée pour un agent :

```bash
# 1. Initialiser (idempotent si .jgreprc existe déjà grâce au guard --force absent)
jgrep install --api-key "$VOYAGE_API_KEY"

# 2. Indexer
jgrep index

# 3. Interroger en mode compact
jgrep "votre requête" --json --compact --topK 5
```

> **Pour les agents à appels intensifs** : désactivez `rerank` dans `.jgreprc` pour éviter un double appel API à chaque recherche. Le gain de précision est réel mais chaque `jgrep search` envoie deux requêtes Voyage AI (embed + rerank).

---

## Architecture

```
src/
├── cli.ts                  # Point d'entrée CLI — commandes install, index, search, update + guard checkInstalled
├── types.ts                # Interfaces TypeScript (FgrepConfig, Chunk, SearchResult, …)
├── commands/
│   ├── install.ts          # Commande install — détection projet, init .jgreprc, .jgrep/, LanceDB, .gitignore
│   ├── index.ts            # Commande index — build incrémental, mode watch, progress TTY-aware
│   ├── search.ts           # Commande search — validation, alias lang, embed query, recherche, formatage
│   └── update.ts           # Commande update — vérification GitHub releases, mise à jour via npm
├── core/
│   ├── config.ts           # Chargement .jgreprc — merge avec les défauts
│   ├── chunker.ts          # Découpage fichiers — chunkFile (lignes fixes) + chunkFileSmart (frontières)
│   ├── embeddings.ts       # Client Voyage AI — embeddings document et query (env > config key)
│   ├── indexer.ts          # Orchestration incrémentale — hash SHA-1, embed, upsert, FTS index
│   ├── reranker.ts         # Re-ranking Voyage Rerank — rerankResults avec relevanceScore
│   ├── search.ts           # searchIndex — dense+cosine gate, hybrid RRF, reranking, overlap dedup
│   ├── store.ts            # LanceDB — table, upsert, delete, FTS index, fullTextSearch
│   ├── walker.ts           # Parcours fichiers — globby, gitignore, include/exclude config, exclusions dures
│   └── lang.ts             # Détection langage par extension (30+ extensions, alias courts supportés)
└── output/
    └── formatter.ts        # Formatage pretty / JSON / --compact
```
