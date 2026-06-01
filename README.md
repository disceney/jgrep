# jgrep

`jgrep` est un CLI de recherche sémantique léger qui indexe votre base de code via les embeddings [Voyage AI](https://www.voyageai.com/) et répond à des requêtes en langage naturel par similarité cosinus locale — une alternative allégée à `mgrep`, sans infrastructure de recherche externe.

## Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
	- [Variable d'environnement](#variable-denvironnement)
	- [Fichier .jgreprc](#fichier-jgreprc)
	- [Référence des options](#référence-des-options)
- [Utilisation](#utilisation)
	- [Indexer le projet](#indexer-le-projet)
	- [Rechercher](#rechercher)
- [Fonctionnement](#fonctionnement)

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

## Configuration

### Variable d'environnement

`jgrep` nécessite une clé API Voyage AI pour générer les embeddings.

```bash
export VOYAGE_API_KEY=your_voyage_api_key
```

Pour ne pas avoir à la redéfinir à chaque session, ajoutez cette ligne à votre `~/.zshrc` ou `~/.bashrc`.

### Fichier .jgreprc

Placez un fichier `.jgreprc` à la racine du projet à indexer pour personnaliser le comportement :

```json
{
  "include": ["src/**"],
  "exclude": ["vendor/**", "node_modules/**", "var/**"],
  "model": "voyage-3",
  "topK": 10,
  "chunkSize": 40,
  "overlap": 10,
  "minScore": 0.4
}
```

### Référence des options

| Option      | Défaut                                                    | Description                                                       |
|-------------|-----------------------------------------------------------|-------------------------------------------------------------------|
| `include`   | `**/*`                                                    | Patterns glob des fichiers à indexer                              |
| `exclude`   | `vendor/**`, `node_modules/**`, `var/**`, `dist/**`, etc. | Patterns glob des fichiers à ignorer (s'ajoute au .gitignore)     |
| `model`     | `voyage-3`                                                | Modèle d'embedding Voyage AI                                      |
| `topK`      | `10`                                                      | Nombre de résultats retournés par défaut                          |
| `chunkSize` | `40`                                                      | Nombre de lignes par chunk                                        |
| `overlap`   | `10`                                                      | Lignes de recouvrement entre deux chunks adjacents                |
| `minScore`  | `0.4`                                                     | Score cosinus minimum (0–1) — filtre les résultats non pertinents |

> Le `.gitignore` du projet est automatiquement respecté, en plus des patterns `exclude`.

---

## Utilisation

### Indexer le projet

Depuis la racine du projet à indexer :

```bash
jgrep index
```

Les fichiers inchangés sont réutilisés depuis le cache (`.jgrep/index.json`) — seuls les fichiers nouveaux ou modifiés sont ré-embeddés.

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

| Option       | Description                                     |
|--------------|-------------------------------------------------|
| `--json`     | Sortie au format JSON (pour scripts / piping)   |
| `--topK <N>` | Nombre de résultats à retourner (écrase `topK`) |

```bash
jgrep "stockage des embeddings" --topK 5
jgrep "gestion des exceptions" --json
```

---

## Fonctionnement

1. **Découverte** — `jgrep index` parcourt les fichiers du projet en respectant `.gitignore` et les patterns `exclude`.
2. **Chunking** — chaque fichier est découpé en fenêtres de lignes chevauchantes (`chunkSize` / `overlap`).
3. **Embedding** — les chunks nouveaux ou modifiés sont envoyés à l'API Voyage AI pour produire des vecteurs denses. Les fichiers inchangés (même hash) sont réutilisés depuis le cache.
4. **Index local** — vecteurs et métadonnées sont persistés dans `.jgrep/index.json`.
5. **Recherche** — la requête est embeddée à la volée puis classée par similarité cosinus contre les vecteurs stockés ; les `topK` résultats dépassant `minScore` sont affichés avec chemin, plage de lignes et score.

Aucun serveur, aucune base de données externe — un fichier JSON et une clé API.
