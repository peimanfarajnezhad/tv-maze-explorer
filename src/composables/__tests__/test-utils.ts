/**
 * Shared test utilities for composables: Pinia app, DB cleanup, show factory.
 */

import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component, ComponentInternalInstance } from 'vue'

import { db } from '@/db'
import type { TvmazeShow } from '@/types'

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

export async function clearDb(): Promise<void> {
  await db.syncMeta.clear()
  await db.shows.clear()
}

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

/** Drain microtask queue so async composable work (e.g. load()) can complete. */
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
