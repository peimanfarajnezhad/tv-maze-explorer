import { describe, it, expect } from 'vitest'
import { screen, renderWithProviders, makeEpisode } from '@/test-utils'

import EpisodeCard from '../EpisodeCard.vue'

describe('EpisodeCard', () => {
  it('renders episode name, season and number', async () => {
    const episode = makeEpisode(1, 2, 3, 'The Pilot')
    await renderWithProviders(EpisodeCard, {
      props: { episode },
    })
    expect(screen.getByText('The Pilot')).toBeInTheDocument()
    expect(screen.getByText('S2 · E3')).toBeInTheDocument()
  })

  it('renders episode image when present', async () => {
    const episode = makeEpisode(1, 1, 1, 'Pilot', {
      image: {
        medium: 'https://example.com/ep.jpg',
        original: 'https://example.com/ep-orig.jpg',
      },
    })
    await renderWithProviders(EpisodeCard, {
      props: { episode },
    })
    const img = screen.getByRole('img', { name: 'Pilot' })
    expect(img).toHaveAttribute('src', 'https://example.com/ep-orig.jpg')
  })

  it('shows "No image" when episode has no image', async () => {
    const episode = makeEpisode(1, 1, 1, 'Pilot', { image: null })
    const { container } = await renderWithProviders(EpisodeCard, {
      props: { episode },
    })
    expect(container.textContent).toContain('No image')
  })

  it('formats airdate when present', async () => {
    const episode = makeEpisode(1, 1, 1, 'Pilot', {
      airdate: '2020-01-15',
    })
    await renderWithProviders(EpisodeCard, {
      props: { episode },
    })
    expect(screen.getByText(/Jan.*15.*2020/)).toBeInTheDocument()
  })
})
