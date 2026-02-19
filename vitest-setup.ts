/**
 * Vitest setup: polyfill IndexedDB for db layer tests (Dexie).
 * Must run before any module that imports Dexie.
 */
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// Embla Carousel (used in GenreCarousel) needs matchMedia in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
