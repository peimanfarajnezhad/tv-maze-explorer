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

import GenresPage from '../GenresPage.vue'

describe('GenresPage', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('renders "Genres" heading', async () => {
    await renderWithProviders(GenresPage, {
      useRouter: true,
      initialRoute: '/genres',
    })
    expect(screen.getByRole('heading', { name: 'Genres', level: 1 })).toBeInTheDocument()
  })

  it('shows skeleton placeholders while loading when no genres', async () => {
    await renderWithProviders(GenresPage, {
      useRouter: true,
      initialRoute: '/genres',
    })
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders genre links when data is loaded', async () => {
    await bulkPutShows([
      makeShow(1, 'Show A', { genres: ['Drama', 'Comedy'] }),
      makeShow(2, 'Show B', { genres: ['Comedy'] }),
    ])

    await renderWithProviders(GenresPage, {
      useRouter: true,
      initialRoute: '/genres',
    })
    await flushPromises()

    await waitFor(
      () => {
        const comedyLinks = screen.getAllByRole('link', { name: 'Comedy' })
        const dramaLinks = screen.getAllByRole('link', { name: 'Drama' })
        expect(comedyLinks.length).toBeGreaterThanOrEqual(1)
        expect(dramaLinks.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('genre links point to genre detail route', async () => {
    await bulkPutShows([makeShow(1, 'Show A', { genres: ['Drama'] })])

    await renderWithProviders(GenresPage, {
      useRouter: true,
      initialRoute: '/genres',
    })
    await flushPromises()

    await waitFor(
      () => {
        const dramaLinks = screen.getAllByRole('link', { name: 'Drama' })
        const withHref = dramaLinks.find((el) => el.getAttribute('href') === '/genres/drama')
        expect(withHref).toBeDefined()
      },
      { timeout: 3000 },
    )
  })

  it('shows "No genres yet" when loaded and empty', async () => {
    await renderWithProviders(GenresPage, {
      useRouter: true,
      initialRoute: '/genres',
    })
    await flushPromises()

    await waitFor(
      () => {
        const messages = screen.getAllByText(/No genres yet/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })
})
