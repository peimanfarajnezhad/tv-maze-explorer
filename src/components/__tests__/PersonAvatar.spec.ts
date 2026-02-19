import { describe, it, expect } from 'vitest'
import { screen, renderWithProviders } from '@/test-utils'

import PersonAvatar from '../PersonAvatar.vue'

describe('PersonAvatar', () => {
  it('renders image when imageUrl is provided', async () => {
    await renderWithProviders(PersonAvatar, {
      props: {
        imageUrl: 'https://example.com/avatar.jpg',
        name: 'Jane Doe',
        subtitle: 'Character Name',
      },
    })
    const img = screen.getByRole('img', { name: 'Jane Doe' })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Character Name')).toBeInTheDocument()
  })

  it('renders initial letter when imageUrl is null', async () => {
    const { container } = await renderWithProviders(PersonAvatar, {
      props: {
        imageUrl: null,
        name: 'John Smith',
      },
    })
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('renders without subtitle when subtitle is omitted', async () => {
    await renderWithProviders(PersonAvatar, {
      props: {
        imageUrl: null,
        name: 'Solo',
      },
    })
    expect(screen.getByText('Solo')).toBeInTheDocument()
    expect(screen.queryByText('S')).toBeInTheDocument()
  })
})
