# jgrep

`jgrep` est un CLI de recherche sémantique léger qui indexe votre base de code via les embeddings [Voyage AI](https://www.voyageai.com/) et répond à des requêtes en langage naturel par similarité cosinus locale — une alternative allégée à `mgrep`, sans infrastructure de recherche externe.

Les vecteurs sont stockés dans une base [LanceDB](https://lancedb.github.io/lancedb/) embarquée (`.jgrep/`). Aucun serveur, aucune base de données externe.

## Table des matières

- [Installation](#installation)
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

```bash
git clone <repo>
cd jgrep
npm install
npm run build
npm link
```

Vérifier que le binaire est disponible :

```bash
which jgrep
jgrep --version
```

---

## Démarrage rapide

`jgrep install` est **la première commande à exécuter** dans chaque projet que vous souhaitez indexer. Elle initialise l'environnement local et refuse de laisser `jgrep index` ou une recherche s'exécuter si elle n'a pas été lancée au préalable.

```bash
cd /path/to/your-project
jgrep install
```

Avec une clé API intégrée au fichier de configuration :

```bash
jgrep install --api-key vo_xxxxxxxxxxxxxxxx
```

`jgrep install` réalise automatiquement les opérations suivantes :

1. **Crée `.jgreprc`** à la racine du projet avec la configuration par défaut (et `voyageApiKey` si `--api-key` est fourni).
2. **Crée le répertoire `.jgrep/`** qui hébergera la base LanceDB.
3. **Initialise la table LanceDB** dans `.jgrep/`.
4. **Met à jour `.gitignore`** en y ajoutant le bloc suivant (créé s'il n'existe pas) :

```
###> jgrep ###
/.jgrep/
/.jgreprc
###< jgrep ###
```

> **Note :** si `.jgreprc` existe déjà, la commande s'arrête sans écraser. Utilisez `--force` pour forcer le remplacement.

---

## Configuration

### Variable d'environnement

`jgrep` utilise la clé API Voyage AI pour générer les embeddings. Elle peut être fournie via la variable d'environnement :

```bash
export VOYAGE_API_KEY=vo_xxxxxxxxxxxxxxxx
```

Ajoutez cette ligne à votre `~/.zshrc` ou `~/.bashrc` pour ne pas avoir à la redéfinir à chaque session.

L'option `voyageApiKey` dans `.jgreprc` est une alternative directe (voir ci-dessous).

### Fichier .jgreprc

Après `jgrep install`, personnalisez `.jgreprc` à la racine du projet :

```json
{
  "include": ["src/**"],
  "exclude": ["vendor/**", "node_modules/**", "var/**"],
  "model": "voyage-code-3",
  "topK": 10,
  "chunkSize": 40,
  "overlap": 10,
  "minScore": 0.3,
  "voyageApiKey": "",
  "rerank": false,
  "rerankCandidates": 30,
  "hybridSearch": false,
  "chunkStrategy": "lines"
}
```

### Référence des options

| Option              | Type                    | Défaut                                                    | Description                                                                                |
|---------------------|-------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `include`           | `string[]`              | `["**/*"]`                                                | Patterns glob des fichiers à indexer                                                       |
| `exclude`           | `string[]`              | `["vendor/**", "node_modules/**", "var/**", "dist/**", …]`| Patterns glob des fichiers à ignorer (s'ajoute au `.gitignore`)                           |
| `model`             | `string`                | `"voyage-code-3"`                                         | Modèle d'embedding Voyage AI                                                               |
| `topK`              | `number`                | `10`                                                      | Nombre de résultats retournés par défaut                                                   |
| `chunkSize`         | `number`                | `40`                                                      | Nombre de lignes par chunk                                                                 |
| `overlap`           | `number`                | `10`                                                      | Lignes de recouvrement entre deux chunks adjacents                                         |
| `minScore`          | `number`                | `0.3`                                                     | Score cosinus minimum (0–1) — filtre les résultats non pertinents                          |
| `voyageApiKey`      | `string`                | `""`                                                      | Clé API Voyage AI (alternative à la variable d'environnement `VOYAGE_API_KEY`)             |
| `rerank`            | `boolean`               | `false`                                                   | Active le re-ranking des résultats via Voyage AI Rerank après la recherche vectorielle     |
| `rerankCandidates`  | `number`                | `30`                                                      | Nombre de candidats récupérés avant re-ranking (doit être ≥ `topK`)                       |
| `hybridSearch`      | `boolean`               | `false`                                                   | Active la recherche hybride (vecteurs + BM25 full-text) pour améliorer le rappel           |
| `chunkStrategy`     | `"lines"` \| `"smart"` | `"lines"`                                                 | Stratégie de découpage : `lines` (fenêtre fixe) ou `smart` (respect des blocs sémantiques)|

> Le `.gitignore` du projet est automatiquement respecté, en plus des patterns `exclude`.

---

## Utilisation

### Indexer le projet

Depuis la racine du projet à indexer (après `jgrep install`) :

```bash
jgrep index
```

Les fichiers inchangés sont réutilisés depuis la base LanceDB (`.jgrep/`) — seuls les fichiers nouveaux ou modifiés sont ré-embeddés.

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

| Option          | Description                                                          |
|-----------------|----------------------------------------------------------------------|
| `--json`        | Sortie au format JSON (pour scripts / piping / agents)               |
| `--topK <N>`    | Nombre de résultats à retourner (écrase `topK` du `.jgreprc`)        |
| `--lang <list>` | Filtre par langage(s), séparés par virgule (ex. `ts,php,py`)         |

```bash
jgrep "stockage des embeddings" --topK 5
jgrep "gestion des exceptions" --json
jgrep "routes API" --lang ts,php --topK 3
```

---

## Modes avancés

Les options `chunkStrategy`, `rerank`, `rerankCandidates` et `hybridSearch` permettent d'adapter `jgrep` à différents contextes de projet. Voici les recommandations par cas d'usage.

### Cas 1 — Projet PHP legacy (fichiers longs, méthodes denses)

Les fichiers PHP legacy contiennent souvent de longues méthodes imbriquées. La stratégie `smart` respecte les frontières de blocs sémantiques ; le re-ranking affine la pertinence après la recherche vectorielle.

```json
{
  "chunkStrategy": "smart",
  "rerank": true,
  "rerankCandidates": 50
}
```

### Cas 2 — Petit projet Python (< 50 fichiers)

Les paramètres par défaut sont suffisants. Le chunking `lines` est rapide et les scores cosinus restent fiables sur de petits corpus.

```json
{
  "chunkStrategy": "lines",
  "rerank": false,
  "hybridSearch": false
}
```

### Cas 3 — Monorepo Symfony / React (vocabulaire mixte, rappel important)

Un monorepo mêle TypeScript, PHP et des noms de composants qui ne sont pas toujours couverts par la seule similarité sémantique. La recherche hybride (vecteurs + BM25) améliore le rappel sur les termes exacts ; le re-ranking réordonne ensuite les candidats.

```json
{
  "hybridSearch": true,
  "rerank": true,
  "rerankCandidates": 40,
  "topK": 15
}
```

---

## Fonctionnement

1. **Initialisation** — `jgrep install` crée `.jgreprc`, initialise la base LanceDB dans `.jgrep/` et met à jour `.gitignore`.
2. **Découverte** — `jgrep index` parcourt les fichiers du projet en respectant `.gitignore` et les patterns `exclude`.
3. **Chunking** — chaque fichier est découpé selon la stratégie choisie (`lines` : fenêtre fixe avec recouvrement ; `smart` : respect des blocs sémantiques du code).
4. **Embedding** — les chunks nouveaux ou modifiés sont envoyés à l'API Voyage AI pour produire des vecteurs denses. Les fichiers inchangés (même hash) sont réutilisés depuis la base.
5. **Index local** — vecteurs et métadonnées sont persistés dans la base LanceDB embarquée (`.jgrep/`).
6. **Recherche** — la requête est embeddée à la volée, puis :
   - en mode standard : classée par similarité cosinus contre les vecteurs stockés ;
   - en mode `hybridSearch` : fusionnée avec un score BM25 full-text ;
   - en mode `rerank` : les `rerankCandidates` meilleurs candidats sont envoyés à l'API Voyage Rerank avant retour final.
7. **Résultats** — les `topK` résultats dépassant `minScore` sont affichés avec chemin, plage de lignes et score.

---

## Utilisation machine / agent

Toutes les commandes `jgrep` supportent une sortie entièrement machine-readable via le flag `--json`.

### Flag `--json`

```bash
jgrep "authentification utilisateur" --json
```

Retourne un tableau JSON sur stdout :

```json
[
  {
    "file": "src/Security/Authenticator.php",
    "startLine": 12,
    "endLine": 51,
    "score": 0.87,
    "lang": "php",
    "text": "..."
  }
]
```

### Codes de sortie

| Code | Signification                                                   |
|------|-----------------------------------------------------------------|
| `0`  | Succès — résultats retournés (ou index construit avec succès)   |
| `1`  | Erreur — projet non initialisé, clé API manquante, autre erreur |

### Prérequis pour les agents

`jgrep install` est la **porte d'entrée obligatoire**. Si `.jgreprc` est absent, toute commande `jgrep index` ou `jgrep <query>` termine avec le code `1` et écrit sur stderr :

```
Error: jgrep is not initialized. Run `jgrep install` first.
```

Séquence d'initialisation recommandée pour un agent :

```bash
# 1. Initialiser (idempotent si .jgreprc existe déjà)
jgrep install --api-key "$VOYAGE_API_KEY"

# 2. Indexer
jgrep index

# 3. Interroger en JSON
jgrep "votre requête" --json --topK 5
```

---

## Architecture

```
src/
├── cli.ts                  # Point d'entrée CLI — définit les commandes (install, index, search)
├── types.ts                # Interfaces TypeScript (FgrepConfig, Chunk, SearchResult, …)
├── commands/
│   ├── install.ts          # Commande install — init .jgreprc, .jgrep/, LanceDB, .gitignore
│   ├── index.ts            # Commande index — build incrémental, mode watch
│   └── search.ts           # Commande search — embed query, recherche, formatage
└── core/
    ├── config.ts           # Chargement de .jgreprc et valeurs par défaut
    ├── chunker.ts          # Découpage des fichiers en chunks (lines / smart)
    ├── embeddings.ts       # Client Voyage AI — embeddings document et query
    ├── indexer.ts          # Orchestration incremental — hash, embed, upsert
    ├── search.ts           # searchIndex — similarité cosinus, filtres, seuil
    ├── store.ts            # LanceDB — ouverture/création table, upsert, delete, stats
    ├── walker.ts           # Parcours des fichiers (globby + gitignore)
    └── lang.ts             # Détection de langage par extension de fichier
```
