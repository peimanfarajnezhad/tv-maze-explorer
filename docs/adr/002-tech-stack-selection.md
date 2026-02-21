# ADR-002: Tech Stack Selection

**Status:** Accepted

**Date:** 2026-02

## Context

The assessment specifies that the preferred tech stack is Vue.js. The goal is to demonstrate proficiency with modern Vue patterns while building a production-quality SPA that handles a non-trivial data layer (IndexedDB sync, rate limiting, pagination).

## Decision

| Layer                    | Choice                                      | Rationale                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | Vue 3.5 (Composition API, `<script setup>`) | Required by the assessment. Composition API enables composable extraction and better TypeScript integration than the Options API.                                                                                                         |
| **Language**             | TypeScript 5.9                              | Strict typing across components, composables, services, and the database layer catches errors at compile time and improves developer experience.                                                                                          |
| **Build tool**           | Vite 7                                      | Fast HMR, native ESM, and first-class Vue support. The standard build tool for modern Vue projects.                                                                                                                                       |
| **State management**     | Pinia 3                                     | The official Vue state manager. The sync engine's reactive state (status, progress, ETA) is exposed through a Pinia store, keeping components decoupled from the engine.                                                                  |
| **Client-side database** | Dexie 4                                     | A typed wrapper around IndexedDB that supports compound indexes, multi-entry indexes, bulk operations, and chainable queries. Essential for index-backed sorting and filtering (see [ADR-004](004-indexeddb-indexes-for-sort-filter.md)). |
| **Styling**              | Tailwind CSS 4                              | Utility-first CSS that enables rapid, consistent styling without context-switching to separate stylesheets. Version 4 integrates via a Vite plugin with zero config.                                                                      |
| **UI components**        | Reka UI (shadcn-vue port) + Lucide icons    | Accessible, unstyled primitives (dialog, select, pagination, tooltip) that compose with Tailwind. Avoids writing custom accessible components from scratch.                                                                               |
| **Utilities**            | VueUse                                      | Provides `useColorMode` for theme management and other reactive browser API wrappers, avoiding hand-rolled implementations.                                                                                                               |
| **Unit testing**         | Vitest 4 + Testing Library + Vue Test Utils | Vitest shares Vite's config and transforms, making setup trivial. Testing Library encourages testing user-visible behaviour. `fake-indexeddb` polyfills IndexedDB in the jsdom environment for database layer tests.                      |
| **E2E testing**          | Playwright                                  | Cross-browser (Chromium, Firefox, WebKit) end-to-end testing with a built-in web server integration for CI.                                                                                                                               |
| **Linting**              | ESLint + Oxlint + Prettier                  | Dual-linter setup: Oxlint runs fast correctness checks, ESLint handles Vue/TypeScript-specific rules, and Prettier enforces formatting. Pre-commit hooks via Husky ensure consistency.                                                    |
| **CI/CD**                | GitHub Actions                              | CI pipeline on pull requests (type-check, unit tests, build). Automatic deployment to GitHub Pages on merge to `main`.                                                                                                                    |

## Consequences

- The stack is entirely frontend-focused, consistent with the assessment's intent.
- All dependencies are mainstream and well-maintained, reducing onboarding friction for reviewers.
- Dexie introduces a runtime dependency for IndexedDB access, but its typed API and index support are essential for the query patterns used throughout the app.
- Reka UI components are unstyled by default, requiring Tailwind classes for visual design, but this avoids fighting opinionated component library styles.
