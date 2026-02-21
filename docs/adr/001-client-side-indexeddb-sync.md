# ADR-001: Client-Side SPA with IndexedDB Background Sync

**Status:** Accepted

**Date:** 2026-02

## Context

The challenge requires building a TV Maze explorer that categorizes shows by genre, supports search, and allows sorting by rating. Two constraints shape the solution:

1. **No server-side sort/filter** — The TV Maze API exposes a paginated `/shows?page=N` endpoint that returns shows in ID order. There are no query parameters for sorting, filtering by genre, or full-text search.
2. **Rate limiting** — The API allows a maximum of 20 requests per 10-second window. Exceeding this limit returns HTTP 429.

To support sorting and filtering on the client, the application needs access to the full catalogue (~80 000 shows across ~361 pages). The question is _where_ and _when_ that data is assembled.

## Alternatives Considered

### Option 1 — Backend with a Nightly Crawler

Deploy an SSR framework (Nuxt.js or Next.js) backed by a database (PostgreSQL, SQLite, or similar). A scheduled job crawls the TV Maze API nightly and upserts shows into the database. The frontend queries the backend, which handles sort, filter, and pagination server-side.

**Pros:**

- Instant, complete results from the first page load.
- Server-side sorting and filtering are trivial with SQL.
- SEO-friendly with server-side rendering.
- Minimal client storage footprint.

**Cons:**

- Requires backend infrastructure, a database, and a scheduler — beyond the scope of a frontend-focused assessment.
- Operational complexity (hosting, monitoring, database maintenance).
- The assessment explicitly asks to demonstrate Vue.js / SPA skills.

### Option 2 — Build-Time JSON Generation on CDN

A build-phase script fetches all shows from the API and outputs one or more static JSON files. These files are deployed alongside the SPA to a CDN. The client loads the JSON at startup and runs sort/filter in memory.

**Pros:**

- No runtime API dependency for catalogue browsing.
- Fast reads from CDN cache.
- Simple deployment (static files).

**Cons:**

- Data goes stale between builds. Freshness requires frequent rebuilds.
- A single JSON file containing all shows is ~80 MB — impractical to load in one request.
- Splitting into many small files adds complexity and still requires downloading most of them for sort/filter.
- No incremental updates; every build re-downloads everything.

### Option 3 — Client-Side IndexedDB Sync (Chosen)

The SPA syncs all shows into the browser's IndexedDB in the background. A `ShowSyncEngine` paginates through the API with a sliding-window rate limiter, persists each page into IndexedDB via Dexie, and tracks sync progress in a `syncMeta` record. The user can explore the app immediately — browsing, searching, and sorting operate on whatever data has been synced so far.

**Pros:**

- Non-blocking UX from the very first visit.
- Sync is pausable, resumable, and survives page refreshes.
- Demonstrates Vue.js Composition API, Pinia, IndexedDB, and browser API skills — the core of the assessment.
- No backend infrastructure needed.
- Data stays in the browser; subsequent visits are instant.

**Cons:**

- Search and sort results are incomplete until sync finishes.
- ~80 MB of IndexedDB storage required.
- Not SEO-friendly (pure SPA).
- First-time sync takes several minutes depending on network and rate-limit headroom.

## Decision

**Option 3 — Client-side IndexedDB sync.**

This approach strikes a balance between solving the data-access problem and demonstrating frontend engineering skills within a Vue.js SPA. The sync engine, rate limiter, IndexedDB indexing, and reactive store integration are all implemented in-house, giving the reviewer direct visibility into design decisions, error handling, and state management patterns.

## Consequences

- Users see partial data during the initial sync. The UI communicates sync progress and warns that results may be incomplete.
- The app requires ~80 MB of IndexedDB storage. Browsers generally allow this without prompting, but it is a non-trivial footprint.
- There is no server-side rendering. The application is invisible to search engine crawlers.
- In a production context, this architecture would be replaced by Option 1 (SSR + database) for completeness, SEO, and instant results.
