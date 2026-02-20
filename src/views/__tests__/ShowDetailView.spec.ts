import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '@/db'
import {
  screen,
  renderWithProviders,
  waitFor,
  makeShow,
  makeCast,
  makeCrew,
  makeSeason,
  makeEpisode,
  clearDb,
  flushPromises,
  mockEmblaCarousel,
} from '@/test-utils'
import * as tvmaze from '@/services/tvmaze'

vi.mock('@/services/tvmaze', () => ({
  getShow: vi.fn(),
}))
vi.mock('@/components/ui/carousel', () => mockEmblaCarousel())

import ShowDetailView from '../ShowDetailView.vue'

describe('ShowDetailView', () => {
  beforeEach(async () => {
    await clearDb()
    vi.mocked(tvmaze.getShow).mockReset()
  })

  it('renders main and skeleton while loading', async () => {
    vi.mocked(tvmaze.getShow).mockImplementation(() => new Promise<never>(() => {}))

    await renderWithProviders(ShowDetailView, {
      useRouter: true,
      initialRoute: '/shows/1',
    })

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows "Show not found" for invalid id', async () => {
    vi.mocked(tvmaze.getShow).mockRejectedValueOnce(new Error('Not found'))

    await renderWithProviders(ShowDetailView, {
      useRouter: true,
      initialRoute: '/shows/999',
    })
    await flushPromises()

    await waitFor(
      () => {
        expect(screen.getByText(/Show not found/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('renders hero, cast, crew and seasons when show loads', async () => {
    const fullShow = {
      ...makeShow(1, 'Breaking Bad', {
        summary: '<p>A chemistry teacher.</p>',
        premiered: '2008-01-20',
        rating: { average: 9.5 },
      }),
      _embedded: {
        cast: [
          makeCast(10, 'Bryan Cranston', 'Walter White'),
          makeCast(11, 'Aaron Paul', 'Jesse Pinkman'),
        ],
        crew: [makeCrew(20, 'Vince Gilligan', 'Creator')],
        seasons: [makeSeason(100, 1), makeSeason(101, 2)],
        episodes: [
          makeEpisode(201, 1, 1, 'Pilot'),
          makeEpisode(202, 1, 2, 'Cats in the Bag'),
          makeEpisode(203, 2, 1, 'Seven Thirty-Seven'),
        ],
      },
    }
    vi.mocked(tvmaze.getShow).mockResolvedValueOnce(fullShow)

    await renderWithProviders(ShowDetailView, {
      useRouter: true,
      initialRoute: '/shows/1',
    })
    await flushPromises()

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Breaking Bad', level: 1 })).toBeInTheDocument()
        expect(screen.getAllByText(/A chemistry teacher/).length).toBeGreaterThanOrEqual(1)
        expect(screen.getByRole('heading', { name: 'Cast', level: 2 })).toBeInTheDocument()
        expect(screen.getByText('Bryan Cranston')).toBeInTheDocument()
        expect(screen.getByText('Walter White')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Crew', level: 2 })).toBeInTheDocument()
        expect(screen.getByText('Vince Gilligan')).toBeInTheDocument()
        expect(
          screen.getByRole('heading', { name: 'Seasons & Episodes', level: 2 }),
        ).toBeInTheDocument()
        expect(screen.getByText('Pilot')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})
