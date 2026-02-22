import { describe, it, expect } from 'vitest'
import { screen, renderWithProviders } from '@/test-utils'

import GenreCard from '../GenreCard.vue'

describe('GenreCard', () => {
  it('renders genre name as link text', async () => {
    await renderWithProviders(GenreCard, {
      props: { genre: 'Drama' },
      useRouter: true,
      initialRoute: '/genres',
    })
    const links = screen.getAllByRole('link', { name: 'Drama' })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toBeInTheDocument()
  })

  it('links to genre detail route with correct slug', async () => {
    await renderWithProviders(GenreCard, {
      props: { genre: 'Drama' },
      useRouter: true,
      initialRoute: '/genres',
    })
    const links = screen.getAllByRole('link', { name: 'Drama' })
    const link = links.find((el) => el.getAttribute('href') === '/genres/drama')
    expect(link).toBeDefined()
    expect(link).toHaveAttribute('href', '/genres/drama')
  })

  it('slugifies genre name with special characters', async () => {
    await renderWithProviders(GenreCard, {
      props: { genre: 'Science-Fiction' },
      useRouter: true,
      initialRoute: '/genres',
    })
    const links = screen.getAllByRole('link', { name: 'Science-Fiction' })
    const link = links.find((el) => el.getAttribute('href') === '/genres/science-fiction')
    expect(link).toBeDefined()
    expect(link).toHaveAttribute('href', '/genres/science-fiction')
  })

  it('decorative watermark has aria-hidden so link has single accessible name', async () => {
    const { container } = await renderWithProviders(GenreCard, {
      props: { genre: 'Comedy' },
      useRouter: true,
      initialRoute: '/genres',
    })
    const link = container.querySelector('a[href="/genres/comedy"]')
    expect(link).toBeInTheDocument()
    const watermark = link?.querySelector('[aria-hidden="true"][class*="font-black"]')
    expect(watermark).toBeInTheDocument()
    expect(watermark).toHaveTextContent('Comedy')
    expect(screen.getAllByRole('link', { name: 'Comedy' }).length).toBeGreaterThanOrEqual(1)
  })
})
