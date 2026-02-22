import { describe, it, expect, beforeEach } from 'vitest'

import { bulkPutShows } from '@/shared/db'
import {
  screen,
  renderWithProviders,
  waitFor,
  makeShow,
  clearDb,
  flushPromises,
} from '@/test-utils'

import GenrePage from '../GenrePage.vue'

describe('GenrePage', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('renders main with heading and sort select', async () => {
    await renderWithProviders(GenrePage, {
      useRouter: true,
      initialRoute: '/genres/drama',
    })
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
  })

  it('shows "Genre not found" for invalid genre slug', async () => {
    await renderWithProviders(GenrePage, {
      useRouter: true,
      initialRoute: '/genres/nonexistent-genre-slug',
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

  it('renders genre heading and show cards when genre has data', async () => {
    await bulkPutShows([
      makeShow(1, 'Show One', {
        genres: ['Drama'],
        image: { medium: 'https://example.com/1.jpg', original: 'https://example.com/1-orig.jpg' },
      }),
      makeShow(2, 'Show Two', {
        genres: ['Drama'],
        image: { medium: 'https://example.com/2.jpg', original: 'https://example.com/2-orig.jpg' },
      }),
    ])

    await renderWithProviders(GenrePage, {
      useRouter: true,
      initialRoute: '/genres/drama',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 2 } },
    })
    await flushPromises()

    await waitFor(
      () => {
        const headings = screen.getAllByRole('heading', { name: 'Drama', level: 1 })
        expect(headings.length).toBeGreaterThanOrEqual(1)
        const showOneImgs = screen.getAllByRole('img', { name: 'Show One' })
        const showTwoImgs = screen.getAllByRole('img', { name: 'Show Two' })
        expect(showOneImgs.length).toBeGreaterThanOrEqual(1)
        expect(showTwoImgs.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('shows pagination when genre has many shows', async () => {
    const shows = Array.from({ length: 25 }, (_, i) =>
      makeShow(i + 1, `Show ${i + 1}`, { genres: ['Drama'] }),
    )
    await bulkPutShows(shows)

    await renderWithProviders(GenrePage, {
      useRouter: true,
      initialRoute: '/genres/drama',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 25 } },
    })
    await flushPromises()

    await waitFor(
      () => {
        const headings = screen.getAllByRole('heading', { name: 'Drama', level: 1 })
        expect(headings.length).toBeGreaterThanOrEqual(1)
        const nextButton = screen.getByRole('button', { name: /next/i })
        expect(nextButton).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })
})
