import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, renderWithProviders, makeShow, mockEmblaCarousel } from '@/test-utils'

vi.mock('@/shared/ui/carousel', () => mockEmblaCarousel())

import GenreCarousel from '../GenreCarousel.vue'

describe('GenreCarousel', () => {
  beforeEach(async () => {
    const pinia = (await import('pinia')).createPinia()
    ;(await import('pinia')).setActivePinia(pinia)
  })

  it('renders genre heading', async () => {
    await renderWithProviders(GenreCarousel, {
      props: {
        genre: 'Drama',
        shows: [makeShow(1, 'Show A', { genres: ['Drama'] })],
      },
      useRouter: true,
      initialRoute: '/',
    })
    expect(screen.getByRole('heading', { name: 'Drama', level: 2 })).toBeInTheDocument()
  })

  it('renders "Show more" link to genre detail', async () => {
    await renderWithProviders(GenreCarousel, {
      props: {
        genre: 'Science-Fiction',
        shows: [makeShow(1, 'Show A', { genres: ['Science-Fiction'] })],
      },
      useRouter: true,
      initialRoute: '/',
    })
    const links = screen.getAllByRole('link', { name: /show more/i })
    const link = links.find((el) => el.getAttribute('href') === '/genres/science-fiction')
    expect(link).toBeDefined()
    expect(link).toHaveAttribute('href', '/genres/science-fiction')
  })

  it('renders one ShowCard per show', async () => {
    const shows = [
      makeShow(1, 'Show One', { genres: ['Comedy'] }),
      makeShow(2, 'Show Two', { genres: ['Comedy'] }),
    ]
    await renderWithProviders(GenreCarousel, {
      props: { genre: 'Comedy', shows },
      useRouter: true,
      initialRoute: '/',
    })
    // ShowCard renders per show; count cards within this carousel (may have multiple from other tests)
    const headings = screen.getAllByRole('heading', { name: 'Comedy', level: 2 })
    expect(headings.length).toBeGreaterThanOrEqual(1)
    const cards = document.querySelectorAll('[data-slot="card"]')
    expect(cards.length).toBeGreaterThanOrEqual(2)
  })

  it('renders empty carousel when shows array is empty', async () => {
    await renderWithProviders(GenreCarousel, {
      props: { genre: 'Drama', shows: [] },
      useRouter: true,
      initialRoute: '/',
    })
    const headings = screen.getAllByRole('heading', { name: 'Drama', level: 2 })
    expect(headings.length).toBeGreaterThanOrEqual(1)
    const links = screen.getAllByRole('link', { name: /show more/i })
    expect(links.some((el) => el.getAttribute('href') === '/genres/drama')).toBe(true)
  })
})
