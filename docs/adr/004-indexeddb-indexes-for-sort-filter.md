# ADR-004: IndexedDB Indexes for Client-Side Sort and Filter

**Status:** Accepted

**Date:** 2026-02

## Context

The TV Maze API does not provide sorting or filtering endpoints. All sorting by rating, sorting by premiere date, filtering by genre, and text search must happen on the client against ~80 000 shows stored in IndexedDB.

Naively loading all shows into memory and sorting with `Array.prototype.sort()` is expensive and scales poorly as the dataset grows. IndexedDB supports indexes that can order records without loading them all into memory.

## Decision

### Schema and Indexes

The Dexie database (`TvMazeDb`) defines the following schema for the `shows` store:

```
shows: 'id, name, *genres, _ratingSort, _premieredSort'
```

| Index            | Type              | Purpose                                                                                                                                                                   |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | Primary key       | Default sort order (show ID, ascending). Also used for direct lookups on the detail page.                                                                                 |
| `name`           | Regular           | Name-based lookups (reserved for future use; current search uses in-memory filter).                                                                                       |
| `*genres`        | Multi-entry       | Dexie's multi-entry index expands the `genres` array so each genre value is independently indexed. Used by `getAllGenresFromDb()` to enumerate unique genres efficiently. |
| `_ratingSort`    | Regular (numeric) | Precomputed sort key: `rating.average ?? -1`. Enables `orderBy('_ratingSort').reverse()` for descending rating sort without loading records into memory.                  |
| `_premieredSort` | Regular (string)  | Precomputed sort key: `premiered ?? '1900-01-01'`. Enables `orderBy('_premieredSort').reverse()` for newest-first sort.                                                   |

### Precomputed Sort Keys

During `bulkPutShows()`, each `TvmazeShow` is transformed into a `StoredTvmazeShow` by the `toStoredShow()` function:

```typescript
{
  ...show,
  _ratingSort: show.rating?.average ?? -1,
  _premieredSort: show.premiered ?? '1900-01-01',
}
```

The fallback values (`-1` for unrated, `'1900-01-01'` for unknown premiere) ensure that shows with missing data sort to the bottom in descending order.

### Query Chain

The `useShowsByGenre` composable builds a Dexie query chain:

```
orderBy(sortIndex)      ← index-backed cursor
  .reverse()            ← if descending (rating, premiered)
  .filter(genreMatch)   ← in-memory genre filter
  .filter(nameMatch)    ← in-memory search filter
  .count()              ← total for pagination controls
  .offset(n).limit(20)  ← page slice
```

The sort is index-backed (Dexie opens a cursor on the chosen index), which avoids loading and sorting the full dataset. Filters run in-memory on each record the cursor visits, which is acceptable for this dataset size.

### Schema Migrations

The database has gone through three schema versions:

1. **v1:** `shows: 'id, name'` — basic schema.
2. **v2:** `shows: 'id, name, *genres'` — added multi-entry genre index.
3. **v3:** `shows: 'id, name, *genres, _ratingSort, _premieredSort'` — added sort-key indexes with a migration that backfills `_ratingSort` and `_premieredSort` for existing records.

## Alternatives Considered

### In-Memory Sort

Load all shows into a JavaScript array and use `Array.prototype.sort()`. Simple to implement but requires holding ~80 000 objects in memory simultaneously, causing GC pressure and potential jank on lower-end devices.

### Compound Indexes

Use Dexie compound indexes like `[genres+_ratingSort]` for combined genre-and-sort queries. This would make genre filtering index-backed as well, but compound indexes with multi-entry keys are not supported by IndexedDB, so the genre filter must remain an in-memory filter after the sort cursor.

## Consequences

- Sorting is efficient and does not require loading the full dataset.
- Genre filtering and text search run in-memory per cursor record. For ~80 000 records this takes tens of milliseconds — imperceptible to the user.
- The precomputed sort keys add two extra fields per record, marginally increasing storage. The trade-off is worthwhile for query performance.
- Schema migrations are handled declaratively by Dexie. Upgrading from v2 to v3 backfills the sort keys for users who already had synced data.
