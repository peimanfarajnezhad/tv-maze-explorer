import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { screen, fireEvent, renderWithProviders } from '@/test-utils'

import AppHeader from '../layout/AppHeader.vue'

describe('AppHeader', () => {
  beforeEach(async () => {
    const pinia = (await import('pinia')).createPinia()
      ; (await import('pinia')).setActivePinia(pinia)
  })

  it('renders app title as home link', async () => {
    await renderWithProviders(AppHeader, {
      useRouter: true,
      initialRoute: '/',
    })
    const homeLink = screen.getByRole('link', { name: 'TV Maze Explorer' })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders main nav with Home, Search, Genres', async () => {
    await renderWithProviders(AppHeader, {
      useRouter: true,
      initialRoute: '/',
    })
    const navs = screen.getAllByRole('navigation', { name: 'Main' })
    expect(navs.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Search' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Genres' }).length).toBeGreaterThanOrEqual(1)
  })

  it('toggles mobile menu when button is clicked', async () => {
    await renderWithProviders(AppHeader, {
      useRouter: true,
      initialRoute: '/',
    })
    const toggles = screen.getAllByRole('button', { name: /toggle menu/i })
    expect(toggles.length).toBeGreaterThanOrEqual(1)
    const toggle = toggles[0]!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(toggle)
    await nextTick()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(toggle)
    await nextTick()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('mobile nav is visible when menu is open', async () => {
    await renderWithProviders(AppHeader, {
      useRouter: true,
      initialRoute: '/',
    })
    const toggles = screen.getAllByRole('button', { name: /toggle menu/i })
    await fireEvent.click(toggles[0]!)

    const mobileNavs = screen.getAllByRole('navigation', { name: 'Main mobile' })
    expect(mobileNavs.length).toBeGreaterThanOrEqual(1)
  })
})
