# ADR-003: Background Sync Engine with Pause/Resume

**Status:** Accepted

**Date:** 2026-02

## Context

The application needs to download ~80 000 shows from the TV Maze API (paginated at ~250 shows per page, ~361 pages total) and store them in IndexedDB. The API enforces a rate limit of 20 requests per 10 seconds. The sync must not block the user from interacting with the app.

## Decision

Implement a `ShowSyncEngine` class and a `RateLimiter` class in `src/services/`. The Pinia store (`useShowSyncStore`) wraps the engine and exposes reactive state to the UI.

### Sync Lifecycle

1. **Initialization** — On app start, the Pinia store reads `syncMeta` from IndexedDB. If the sync was previously completed, the store restores the completed state. If it was paused, the store restores the paused state. Otherwise, it creates a new `ShowSyncEngine` and calls `start()`.
2. **Page probing** — Before fetching sequentially, the engine estimates the total number of pages via binary search. Starting from `lastCompletedPage + 1`, it probes up to 500 pages ahead, using HTTP 404 responses (TV Maze returns 404 for out-of-range pages) to narrow the upper bound. This enables a progress bar and ETA calculation.
3. **Sequential fetch** — The engine loops through pages starting from `lastCompletedPage + 1`. For each page:
  - It calls `rateLimiter.acquire()` to wait for an available slot.
  - It fetches `GET /shows?page=N`.
  - On success, it calls `bulkPutShows()` to upsert shows into IndexedDB (with precomputed sort keys) and `updateSyncMeta()` to persist progress.
  - It emits a progress event with the current page, total stored, pages/second, and estimated time remaining.
4. **Completion** — When a page returns an empty array (or 404), the engine marks `isCompleted: true` in `syncMeta` and calls `onComplete()`.

### Error Handling and Retry


| Error                           | Strategy                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **HTTP 429** (rate limited)     | Exponential backoff starting at 2 s, doubling up to 30 s max. Retries indefinitely until successful.                    |
| **HTTP 5xx / network errors**   | Retry up to 5 times with backoff schedule: 1 s, 2 s, 4 s, 8 s, 16 s. If all retries fail, the engine calls `onError()`. |
| **HTTP 4xx (non-404, non-429)** | Throw immediately — these indicate a client-side bug.                                                                   |
| **IndexedDB write failure**     | Report error via `onError()` — no retry (likely a storage quota or browser issue).                                      |


### Pause and Resume

- `pause()` sets an internal flag. The main loop calls `#waitIfPaused()` which polls every 100 ms until the flag is cleared.
- `resume()` clears the flag. The loop continues from where it left off.
- The paused state is persisted to `syncMeta.isPaused` in IndexedDB, so a browser refresh correctly restores the paused state.

### Rate Limiter

The `RateLimiter` class implements a sliding-window algorithm:

- It maintains an array of request timestamps.
- On `acquire()`, it prunes timestamps older than the window (10 s) and checks whether the count is below the maximum (20).
- If a slot is available, it records the timestamp and resolves immediately.
- If at capacity, it calculates the wait time until the oldest timestamp expires, queues the caller, and schedules processing via `setTimeout`.
- `dispose()` rejects all queued promises to prevent dangling promises when the engine stops.

### ETA Calculation

The engine tracks the last 20 page-fetch timestamps in a rolling window. Pages per second is computed as `(window.length - 1) / (newest - oldest)`. The ETA is `remainingPages * msPerPage`.

## Consequences

- The user can browse, search, and sort from the first moment — the sync never blocks the UI thread (it runs in the same thread but yields via `await`).
- Sync progress survives page refreshes. Returning users who previously completed the sync see instant results with no network requests for catalogue data.
- The rate limiter is conservative — it tracks client-side timestamps but does not account for other tabs or browser extensions making requests to the same API. In practice, TV Maze's rate limit is generous enough that collisions are rare.
- The engine is a plain TypeScript class with no framework dependencies, making it independently testable.

