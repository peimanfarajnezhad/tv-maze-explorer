import { describe, it, expect, beforeEach } from 'vitest'

import { bulkPutShows } from '@/db'
import {
  screen,
  within,
  renderWithProviders,
  waitFor,
  fireEvent,
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
    const { container } = await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search',
    })
    const view = within(container as HTMLElement)
    expect(view.getByRole('main')).toBeInTheDocument()
    expect(view.getByPlaceholderText('Search shows...')).toBeInTheDocument()
    expect(view.getByRole('combobox', { name: /filter by genre/i })).toBeInTheDocument()
    expect(view.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
  })

  it('pre-fills search input from q query param', async () => {
    const { container } = await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?q=test',
    })
    await flushPromises()

    const view = within(container as HTMLElement)
    await waitFor(
      () => {
        const input = view.getByPlaceholderText('Search shows...')
        expect(input).toHaveValue('test')
      },
      { timeout: 3000 },
    )
  })

  it('navigates with q param when Enter is pressed in search input', async () => {
    const { container, router } = await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search',
    })
    await flushPromises()

    const view = within(container as HTMLElement)
    const input = view.getByPlaceholderText('Search shows...')
    await fireEvent.update(input, 'breaking bad')
    await fireEvent.keyDown(input, { key: 'Enter' })
    await flushPromises()

    await waitFor(() => {
      expect(router.currentRoute.value.query.q).toBe('breaking bad')
    })
  })

  it('clears q from route when search input is emptied and Enter pressed', async () => {
    const { container, router } = await renderWithProviders(SearchView, {
      useRouter: true,
      initialRoute: '/search?q=hello',
    })
    await flushPromises()

    const view = within(container as HTMLElement)
    const input = view.getByPlaceholderText('Search shows...')
    await fireEvent.update(input, '')
    await fireEvent.keyDown(input, { key: 'Enter' })
    await flushPromises()

    await waitFor(() => {
      expect(router.currentRoute.value.query.q).toBeUndefined()
    })
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
    await bulkPutShows([
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
    await bulkPutShows([makeShow(1, 'Show A', { genres: ['Drama'] })])

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
