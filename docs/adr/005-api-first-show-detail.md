# ADR-005: API-First Strategy for Show Detail Page

**Status:** Accepted

**Date:** 2026-02

## Context

The show detail page needs to display cast, crew, seasons, episodes, and images alongside the core show metadata. During the background sync (see [ADR-001](001-client-side-indexeddb-sync.md)), only the base show data from `/shows?page=N` is stored in IndexedDB. The embedded resources (cast, crew, seasons, episodes, images) are not included in the paginated response.

The question is whether to store embedded data during sync or to fetch it on demand when the user visits a show's detail page.

## Alternatives Considered

### Store Embeds During Sync

For each show, make an additional API call with `?embed[]=cast&embed[]=crew&embed[]=seasons&embed[]=episodes&embed[]=images` and persist the full response in IndexedDB.

**Pros:**

- Instant detail pages with no network request.
- Fully offline-capable detail views.

**Cons:**

- Multiplies storage from ~80 MB to an estimated 300+ MB (cast and episode data for 80 000 shows).
- Multiplies API calls during sync — one extra request per show (80 000 additional requests at 20 req/10 s = ~11 hours of sync time).
- Most users will only visit a handful of show detail pages, making the vast majority of stored data unused.

### Fetch on Demand (Chosen)

Fetch the full show data with embeds via a single API call when the user navigates to the detail page. Display cached IndexedDB data (from the bulk sync) instantly while the API call loads.

**Pros:**

- No additional storage or sync time.
- A single API request per detail view is fast and within rate-limit headroom.
- Progressive loading: the user sees the show's name, poster, and rating immediately (from IndexedDB), then cast/crew/seasons/episodes appear after the API responds.

**Cons:**

- Detail pages require network connectivity.
- A brief loading state while the API call resolves (mitigated by showing cached data first).

## Decision

**Fetch on demand.** The `useShowDetail` composable implements progressive loading:

1. Read the show from IndexedDB (`db.shows.get(id)`) and render it immediately.
2. Fire `getShow(id)` which calls `GET /shows/:id?embed[]=images&embed[]=seasons&embed[]=episodes&embed[]=crew&embed[]=cast`.
3. On response, update the reactive state with the full data (cast, crew, seasons, episode groups, background/poster images).
4. If the API call fails but IndexedDB data exists, the user still sees the basic show information with an error notice.

The TV Maze API returns all five embeds in a single response, so only one request is needed per detail view. This is well within the rate-limit budget even if the user navigates rapidly.

## Consequences

- Detail pages are fast to load in practice — the IndexedDB read is sub-millisecond, and the API call typically resolves in 100–300 ms.
- Storage remains bounded to the base catalogue (~80 MB) regardless of how many detail pages the user visits.
- The app degrades gracefully: if the API is unreachable, users still see basic show information from the local database.
- In a production SSR setup (see [ADR-001](001-client-side-indexeddb-sync.md)), the server would fetch and cache embed data, making this pattern unnecessary.
