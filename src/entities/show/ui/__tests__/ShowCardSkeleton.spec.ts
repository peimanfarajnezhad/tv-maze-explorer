import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test-utils'

import ShowCardSkeleton from '../ShowCardSkeleton.vue'

describe('ShowCardSkeleton', () => {
  it('renders a card with skeleton placeholder', async () => {
    await renderWithProviders(ShowCardSkeleton, {})
    const card = document.querySelector('[class*="rounded"]')
    expect(card).toBeInTheDocument()
    const skeleton = document.querySelector('[class*="animate-pulse"]')
    expect(skeleton).toBeInTheDocument()
  })

  it('has card and skeleton structure', async () => {
    const { container } = await renderWithProviders(ShowCardSkeleton, {})
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toBeInTheDocument()
    const skeleton = container.querySelector('[class*="animate-pulse"]')
    expect(skeleton).toBeInTheDocument()
  })
})
