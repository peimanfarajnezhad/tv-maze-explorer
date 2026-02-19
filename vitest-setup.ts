/**
 * Vitest setup: polyfill IndexedDB for db layer tests (Dexie).
 * Must run before any module that imports Dexie.
 */
import 'fake-indexeddb/auto'
