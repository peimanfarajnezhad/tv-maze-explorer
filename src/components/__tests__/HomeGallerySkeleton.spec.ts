import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test-utils'

import HomeGallerySkeleton from '../HomeGallerySkeleton.vue'

describe('HomeGallerySkeleton', () => {
  it('renders 3 skeleton rows', async () => {
    const { container } = await renderWithProviders(HomeGallerySkeleton, {})
    const sections = container.querySelectorAll('section')
    expect(sections).toHaveLength(3)
  })

  it('renders 6 card skeletons per row', async () => {
    const { container } = await renderWithProviders(HomeGallerySkeleton, {})
    const sections = container.querySelectorAll('section')
    sections.forEach((section) => {
      const row = section.querySelector('.flex.gap-4')
      expect(row?.children.length).toBe(6)
    })
  })

  it('each row has a header skeleton and card skeletons', async () => {
    const { container } = await renderWithProviders(HomeGallerySkeleton, {})
    const sections = container.querySelectorAll('section')
    sections.forEach((section) => {
      const headerSkeletons = section.querySelectorAll('[class*="h-7"]')
      expect(headerSkeletons.length).toBeGreaterThanOrEqual(1)
    })
  })
})
