import { describe, it, expect } from 'vitest'
import { screen, within, renderWithProviders, makeShow } from '@/test-utils'

import ShowCard from '../ShowCard.vue'

describe('ShowCard', () => {
  it('renders show name as image alt text when show has image', async () => {
    const show = makeShow(1, 'Breaking Bad', {
      image: {
        medium: 'https://example.com/bb.jpg',
        original: 'https://example.com/bb-original.jpg',
      },
    })
    await renderWithProviders(ShowCard, {
      props: { show },
    })
    const img = screen.getByRole('img', { name: 'Breaking Bad' })
    expect(img).toBeInTheDocument()
  })

  it('renders rating with star and formatted value', async () => {
    const show = makeShow(1, 'Test Show', { rating: { average: 9.2 } })
    await renderWithProviders(ShowCard, {
      props: { show },
    })
    expect(screen.getByText('9.2')).toBeInTheDocument()
  })

  it('shows "No image" when show has no image', async () => {
    const show = makeShow(1, 'Test Show', { image: null })
    const { container } = await renderWithProviders(ShowCard, {
      props: { show },
    })
    expect(within(container as HTMLElement).getByText('No image')).toBeInTheDocument()
  })

  it('shows em dash for rating when average is missing', async () => {
    const show = makeShow(1, 'Test Show', {
      rating: { average: undefined as unknown as number },
    })
    await renderWithProviders(ShowCard, {
      props: { show },
    })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders image when show has image.medium', async () => {
    const show = makeShow(1, 'Test Show', {
      image: {
        medium: 'https://example.com/poster.jpg',
        original: 'https://example.com/poster-original.jpg',
      },
    })
    const { container } = await renderWithProviders(ShowCard, {
      props: { show },
    })
    const img = within(container as HTMLElement).getByRole('img', {
      name: 'Test Show',
    })
    expect(img).toHaveAttribute('src', 'https://example.com/poster.jpg')
    expect(
      within(container as HTMLElement).queryByText('No image'),
    ).not.toBeInTheDocument()
  })
})
