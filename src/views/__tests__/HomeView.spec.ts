import { describe, it, expect, beforeEach, vi } from 'vitest'

import { db } from '@/db'
import { screen, renderWithProviders, waitFor, makeShow, clearDb, flushPromises, mockEmblaCarousel } from '@/test-utils'

vi.mock('@/components/ui/carousel', () => mockEmblaCarousel())

import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  beforeEach(async () => {
    await clearDb()
  })

  it('renders main with skeleton when loading or empty', async () => {
    await renderWithProviders(HomeView, {
      useRouter: true,
      initialRoute: '/',
    })
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows "No shows yet" when loaded and no data', async () => {
    await renderWithProviders(HomeView, {
      useRouter: true,
      initialRoute: '/',
    })
    await flushPromises()

    await waitFor(
      () => {
        const messages = screen.getAllByText(/No shows yet/)
        expect(messages.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('renders genre carousels when data is in DB', async () => {
    await db.shows.bulkPut([
      makeShow(1, 'Show A', { genres: ['Drama'] }),
      makeShow(2, 'Show B', { genres: ['Drama', 'Comedy'] }),
    ])

    await renderWithProviders(HomeView, {
      useRouter: true,
      initialRoute: '/',
    })
    await flushPromises()

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Comedy', level: 2 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Drama', level: 2 })).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})
