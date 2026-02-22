/**
 * Shared test utilities for Vue component and composable tests.
 * Provides render with Pinia/Router, data factories, DB helpers, and composable mount helpers.
 */

import type { Component, ComponentInternalInstance } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { render, type RenderOptions } from '@testing-library/vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { mount, type VueWrapper } from '@vue/test-utils'

import { db } from '@/shared/db'
import { routes } from '@/app/router'
import type {
  TvmazeShow,
  TvmazeCast,
  TvmazeCrew,
  TvmazeSeason,
  TvmazeEpisode,
  TvmazePerson,
  TvmazeCharacter,
} from '@/shared/types'
import { useShowSyncStore, type SyncStatus } from '@/features/show-sync'

// --- Data & DB helpers ---

/** Minimal TvmazeShow for tests */
export function makeShow(
  id: number,
  name: string,
  overrides: Partial<TvmazeShow> = {},
): TvmazeShow {
  return {
    id,
    name,
    url: `https://example.com/${id}`,
    type: 'Scripted',
    language: 'English',
    genres: [],
    status: 'Running',
    runtime: 60,
    averageRuntime: 60,
    premiered: '2020-01-01',
    ended: null,
    officialSite: null,
    schedule: { time: '20:00', days: ['Monday'] },
    rating: { average: 8 },
    weight: 1,
    network: null,
    webChannel: null,
    dvdCountry: null,
    externals: { tvrage: null, thetvdb: null, imdb: null },
    image: null,
    summary: null,
    updated: 1,
    _links: { self: { href: '' } },
    ...overrides,
  } as TvmazeShow
}

function makePerson(id: number, name: string, overrides: Partial<TvmazePerson> = {}): TvmazePerson {
  return {
    id,
    name,
    url: `https://example.com/people/${id}`,
    country: null,
    birthday: null,
    deathday: null,
    gender: 'Male',
    image: null,
    updated: 1,
    _links: { self: { href: '' } },
    ...overrides,
  }
}

function makeCharacter(
  id: number,
  name: string,
  overrides: Partial<TvmazeCharacter> = {},
): TvmazeCharacter {
  return {
    id,
    name,
    url: `https://example.com/characters/${id}`,
    image: null,
    _links: { self: { href: '' } },
    ...overrides,
  }
}

/** Minimal TvmazeCast for tests */
export function makeCast(
  personId: number,
  personName: string,
  characterName: string,
  overrides: Partial<TvmazeCast> = {},
): TvmazeCast {
  return {
    person: makePerson(personId, personName),
    character: makeCharacter(personId, characterName),
    self: false,
    voice: false,
    ...overrides,
  }
}

/** Minimal TvmazeCrew for tests */
export function makeCrew(
  personId: number,
  personName: string,
  type: string,
  overrides: Partial<TvmazeCrew> = {},
): TvmazeCrew {
  return {
    type,
    person: makePerson(personId, personName),
    ...overrides,
  }
}

/** Minimal TvmazeSeason for tests */
export function makeSeason(
  id: number,
  number: number,
  overrides: Partial<TvmazeSeason> = {},
): TvmazeSeason {
  return {
    id,
    url: `https://example.com/seasons/${id}`,
    number,
    name: `Season ${number}`,
    episodeOrder: 10,
    premiereDate: null,
    endDate: null,
    network: null,
    webChannel: null,
    image: null,
    summary: null,
    _links: { self: { href: '' } },
    ...overrides,
  }
}

/** Minimal TvmazeEpisode for tests */
export function makeEpisode(
  id: number,
  season: number,
  number: number,
  name: string,
  overrides: Partial<TvmazeEpisode> = {},
): TvmazeEpisode {
  return {
    id,
    url: `https://example.com/episodes/${id}`,
    name,
    season,
    number,
    type: 'regular',
    airdate: null,
    airtime: null,
    airstamp: null,
    runtime: null,
    rating: { average: null },
    image: null,
    summary: null,
    _links: { self: { href: '' }, show: { href: '', name: '' } },
    ...overrides,
  }
}

export async function clearDb(): Promise<void> {
  await db.syncMeta.clear()
  await db.shows.clear()
}

/** Drain microtask queue so async work (e.g. composable load()) can complete. */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Wait until a predicate is true, flushing promises each tick. Use to wait for async composable state. */
export async function waitUntil(
  predicate: () => boolean,
  options: { timeoutMs?: number; tickMs?: number } = {},
): Promise<void> {
  const { timeoutMs = 2000, tickMs = 10 } = options
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitUntil timed out')
    }
    await flushPromises()
    await new Promise((r) => setTimeout(r, tickMs))
  }
}

// --- Component render (Testing Library) ---

/** Create a router instance with memory history for tests (no URL side effects). */
export function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [...routes],
  })
}

export interface ComponentTestOptions extends RenderOptions<Component> {
  /** Use a real router (memory history). Default true when component uses useRoute/useRouter. */
  useRouter?: boolean
  /** Initial route. Only used when useRouter is true. */
  initialRoute?: string
  /** Initial store state applied before mount (e.g. so views do not wait on sync delay). */
  initialStoreState?: {
    showSync?: Partial<{
      isInitialized: boolean
      status: SyncStatus
      totalShowsStored: number
    }>
  }
}

type RenderResult = ReturnType<typeof render>
type TestRouter = ReturnType<typeof createTestRouter>

/**
 * Render a Vue component with Pinia (and optionally Vue Router) so stores and routing work.
 * Use for components that call useShowSyncStore(), useRoute(), useRouter(), or RouterLink.
 * When useRouter is true, the result includes a router property.
 */
export async function renderWithProviders(
  component: Component,
  options: ComponentTestOptions & { useRouter: true },
): Promise<RenderResult & { router: TestRouter }>
export async function renderWithProviders(
  component: Component,
  options?: ComponentTestOptions,
): Promise<RenderResult>
export async function renderWithProviders(
  component: Component,
  options: ComponentTestOptions = {},
): Promise<RenderResult | (RenderResult & { router: TestRouter })> {
  const {
    useRouter: withRouter = false,
    initialRoute = '/',
    initialStoreState,
    ...renderOptions
  } = options

  const pinia = createPinia()
  setActivePinia(pinia)
  if (initialStoreState?.showSync) {
    const store = useShowSyncStore()
    store.$patch(initialStoreState.showSync)
  }

  const global = {
    ...renderOptions.global,
    plugins: [pinia, ...(renderOptions.global?.plugins ?? [])],
  }

  if (withRouter) {
    const router = createTestRouter()
    await router.push(initialRoute)
    await router.isReady()
    global.plugins = [pinia, router]
    const result = await render(component, {
      ...renderOptions,
      global,
    })
    return { ...result, router }
  }

  return render(component, {
    ...renderOptions,
    global,
  })
}

// --- Composable mount (Vue Test Utils) ---

/**
 * Mount a component that uses a composable inside a Pinia app so store and lifecycle work.
 * Returns the wrapper; use wrapper.vm to access exposed refs if the component defineExpose's them.
 */
export function mountWithPinia<T>(
  component: Component,
  options?: { props?: object; expose?: (vm: ComponentInternalInstance & T) => void },
): VueWrapper {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(component, {
    global: {
      plugins: [pinia],
    },
    ...options,
  })
}

/**
 * Helper to mount a component that only runs a composable and exposes its return value.
 * The composableRunner receives no props and must call a composable and expose the result.
 */
export function mountComposable<T>(composableRunner: () => T): VueWrapper & { result: T } {
  let result!: T
  const TestComponent = {
    setup() {
      result = composableRunner()
      return { result }
    },
    template: '<div />',
  }
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(TestComponent, {
    global: { plugins: [pinia] },
  })
  return Object.assign(wrapper, { result }) as VueWrapper & { result: T }
}

// --- Carousel mock (for tests that use GenreCarousel / Embla) ---

/** Stub for @/components/ui/carousel so Embla (matchMedia, etc.) is not required in jsdom. Use: vi.mock('@/components/ui/carousel', () => mockEmblaCarousel()) */
export function mockEmblaCarousel() {
  return {
    Carousel: {
      name: 'Carousel',
      template:
        '<div class="carousel-stub"><slot :canScrollNext="true" :canScrollPrev="false" /></div>',
    },
    CarouselContent: {
      name: 'CarouselContent',
      template: '<div class="carousel-content-stub"><slot /></div>',
    },
    CarouselItem: {
      name: 'CarouselItem',
      template: '<div class="carousel-item-stub"><slot /></div>',
    },
    CarouselNext: {
      name: 'CarouselNext',
      template: '<span class="carousel-next-stub"><slot /></span>',
    },
    CarouselPrevious: {
      name: 'CarouselPrevious',
      template: '<span class="carousel-prev-stub"><slot /></span>',
    },
  }
}

/** Re-export everything from @testing-library/vue for convenience. */
export { render, screen, within, fireEvent, waitFor } from '@testing-library/vue'
