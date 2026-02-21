import { describe, it, expect } from 'vitest'
import { screen, renderWithProviders, makeShow } from '@/test-utils'

import ShowGrid from '../ShowGrid.vue'

const renderOptions = { useRouter: true }

describe('ShowGrid', () => {
  it('shows "Genre not found" when notFound is true', async () => {
    await renderWithProviders(ShowGrid, {
      props: {
        shows: [],
        notFound: true,
        loading: false,
        page: 1,
        totalCount: 0,
      },
      ...renderOptions,
    })
    expect(screen.getByText(/Genre not found/)).toBeInTheDocument()
  })

  it('renders skeleton placeholders when loading', async () => {
    const { container } = await renderWithProviders(ShowGrid, {
      props: {
        shows: [],
        notFound: false,
        loading: true,
        skeletonCount: 5,
        page: 1,
        totalCount: 0,
      },
      ...renderOptions,
    })
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders show cards when not loading and shows provided', async () => {
    const shows = [
      makeShow(1, 'Show One', {
        image: { medium: 'https://example.com/1.jpg', original: 'https://example.com/1-orig.jpg' },
      }),
    ]
    await renderWithProviders(ShowGrid, {
      props: {
        shows,
        notFound: false,
        loading: false,
        page: 1,
        totalCount: 1,
      },
      ...renderOptions,
    })
    expect(screen.getByRole('img', { name: 'Show One' })).toBeInTheDocument()
  })

  it('shows custom empty title and description when no shows', async () => {
    await renderWithProviders(ShowGrid, {
      props: {
        shows: [],
        notFound: false,
        loading: false,
        page: 1,
        totalCount: 0,
        emptyTitle: 'No shows in this genre yet',
        emptyDescription: 'Try another genre or check back later.',
      },
      ...renderOptions,
    })
    expect(screen.getByText('No shows in this genre yet')).toBeInTheDocument()
    expect(screen.getByText('Try another genre or check back later.')).toBeInTheDocument()
  })

  it('emits update:page when pagination is used', async () => {
    const shows = Array.from({ length: 20 }, (_, i) => makeShow(i + 1, `Show ${i + 1}`))
    const { emitted } = await renderWithProviders(ShowGrid, {
      props: {
        shows,
        notFound: false,
        loading: false,
        page: 1,
        totalCount: 25,
      },
      ...renderOptions,
    })
    const nextButton = screen.getByRole('button', { name: /next/i })
    await nextButton.click()
    expect(emitted()['update:page']).toBeDefined()
    expect(emitted()['update:page']?.[0]).toEqual([2])
  })
})
