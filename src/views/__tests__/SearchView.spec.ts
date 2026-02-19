import { describe, it, expect, beforeEach } from 'vitest'

import { db } from '@/db'
import {
  screen,
  renderWithProviders,
  waitFor,
  makeShow,
  clearDb,
  flushPromises,
} from '@/test-utils'

import SearchView from '../SearchView.vue'

describe('SearchView', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('renders main with genre and sort selects', async () => {
    await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search',
    })
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /filter by genre/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
  })

  it('shows "Searching: q" chip with clear button when query.q is set', async () => {
    await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?q=test',
    })
    await flushPromises()

    await waitFor(
      () => {
        expect(screen.getByText(/Searching:/)).toBeInTheDocument()
        expect(screen.getByText('test')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('shows "Genre not found" for invalid genre in query', async () => {
    await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?genre=invalid-slug-xyz',
    })
    await flushPromises()

    await waitFor(
      () => {
        const messages = screen.getAllByText(/Genre not found/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('renders show cards when results match', async () => {
    await db.shows.bulkPut([
      makeShow(1, 'Match Show', {
        genres: ['Drama'],
        image: {
          medium: 'https://example.com/match.jpg',
          original: 'https://example.com/match-orig.jpg',
        },
      }),
      makeShow(2, 'Other', { genres: ['Comedy'] }),
    ])

    await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?genre=drama',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 2 } },
    })
    await flushPromises()

    await waitFor(
      () => {
        const imgs = screen.getAllByRole('img', { name: 'Match Show' })
        expect(imgs.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('shows "No shows match your filters" when no results', async () => {
    await db.shows.bulkPut([makeShow(1, 'Show A', { genres: ['Drama'] })])

    await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?genre=comedy',
    })
    await flushPromises()

    await waitFor(
      () => {
        const messages = screen.getAllByText(/No shows match your filters/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })
})
