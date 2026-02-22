# ADR-006: Feature-Sliced Design Architecture

**Status:** Accepted

**Date:** 2026-02

## Context

The application is structured as a flat modular codebase: components in `components/`, composables in `composables/`, stores in `stores/`, services in `services/`, types in `types/`, and views in `views/`. This organization groups code by technical type rather than by business domain. As the codebase grows, several pain points emerge:

1. **Feature hunting** — Understanding a single feature (e.g. genre browsing or show sync) requires jumping across many folders: views, composables, components, stores, services, types. There is no single place that owns a feature.
2. **Unclear ownership** — Components like `ShowCard`, `GenreCarousel`, and `ShowSyncDashboard` live alongside generic UI primitives in `components/`, making it hard to distinguish domain-specific from shared code.
3. **Scattered refactors** — Changing or removing a feature risks missing imports in stores, composables, or services; refactors are fragile.
4. **Scaling** — Adding new domains (e.g. user preferences, favourites) would further dilute the flat structure and increase coupling.

The goal is to adopt an architecture that scales with growth, keeps features isolated, and makes dependency direction explicit so that the codebase remains understandable and safe to refactor.

## Alternatives Considered

### Option 1 — Status quo (flat modular)

Keep the current structure: `components/`, `composables/`, `stores/`, `services/`, `types/`, `views/`.

**Pros:** No migration cost; familiar to developers used to technical-layer organization.

**Cons:** Does not address feature scattering or coupling; pain will increase as the app grows. Refactoring and onboarding remain costly.

### Option 2 — Refined modular

Keep technical layers but add sub-grouping (e.g. `components/domain/`, `composables/show/`, `composables/genre/`).

**Pros:** Low migration effort; some improvement in discoverability.

**Cons:** Still organizes by "what it is" rather than "what it does". Features remain spread across multiple top-level folders. Does not enforce dependency direction or public APIs.

### Option 3 — Micro-frontends

Split the application into multiple independently deployable frontend applications.

**Pros:** Strong team and deployment boundaries; technology independence per app.

**Cons:** Operational and runtime complexity (routing, shared state, versioning) is high. Not justified for the current team size and single-product scope. Would be a large architectural leap with limited immediate benefit.

### Option 4 — Feature-Sliced Design (FSD)

Adopt Feature-Sliced Design: organize code into layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) and slices within layers by business domain. Enforce unidirectional dependencies (higher layers may only import from lower layers) and public APIs per slice via `index.ts`.

**Pros:**

- **Feature cohesion** — Everything for a feature or entity lives in one slice (UI, model, API together). Understanding "show sync" or "genre" means opening one folder.
- **Explicit dependency direction** — Layers and public APIs prevent circular imports and accidental coupling. Refactors are localized.
- **Scalability** — Adding new entities or features is additive; existing slices stay untouched. Aligns with Vue 3 Composition API and composables.
- **Ecosystem support** — FSD has official documentation, a linter (Steiger), and is widely recommended for Vue 3 in 2025. Onboarding is easier with a standard, named architecture.

**Cons:**

- **Migration cost** — One-time move of existing files and update of all imports. Plan is phased to keep tests green at each step.
- **Learning curve** — Team must internalize layers, slices, segments, and import rules; documentation and the architecture guide mitigate this.

## Decision

**Adopt Feature-Sliced Design (Option 4).**

The codebase will be reorganized into the following layers under `src/`:

| Layer      | Purpose                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- |
| `app`      | Global bootstrap: router, styles, providers. No slices.                                     |
| `pages`    | Route-level compositions; thin, assembly only.                                              |
| `widgets`  | Large self-contained UI blocks (e.g. app layout, show-sync dashboard, genre carousels).     |
| `features` | User interactions and use cases (e.g. show-sync control, theme toggle).                     |
| `entities` | Business domain models: show, genre, episode, person (UI + types + composables per entity). |
| `shared`   | Domain-agnostic code: UI primitives, API client, DB layer, lib, config. No slices.          |

Dependency rule: a module may only import from layers strictly below it (and from the same slice where allowed). Each slice exposes a public API via `index.ts`; internal implementation is not imported from outside the slice.

Migration will be executed in six phases (documentation first, then shared → entities → features → widgets → pages/app → cleanup and Steiger linter), with type-check and tests passing after each phase.

## Consequences

- **Migration** — Existing files will move to new paths; all imports will be updated. Test files move with their source. Phased approach keeps the diff reviewable and reversible.
- **Linting** — Steiger will be added to enforce FSD rules and prevent future violations.
- **Documentation** — ADR-006 records the decision; `docs/architecture/fsd-structure.md` describes the target structure, dependency rules, segment conventions, and the full file mapping. README will reference the new architecture.
- **Onboarding** — New contributors get a single, named architecture and a clear place to add features or entities. Public APIs reduce the need to understand internal implementation.
- **Types** — Entity-level types live in `entities/<entity>/model/types.ts`; shared types remain in `shared` where appropriate. The old `src/types/` barrel is removed in favour of entity-scoped exports.
