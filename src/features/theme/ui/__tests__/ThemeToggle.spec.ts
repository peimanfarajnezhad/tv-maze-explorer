import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/vue'
import { screen, fireEvent, renderWithProviders } from '@/test-utils'

import ThemeToggle from '../ThemeToggle.vue'

const refs = vi.hoisted(() => ({
  mockStoreRef: null as import('vue').Ref<'light' | 'dark' | 'auto'> | null,
  mockCycle: vi.fn(),
}))

vi.mock('@/features/theme/model/use-theme', async () => {
  const vue = await vi.importActual<typeof import('vue')>('vue')
  refs.mockStoreRef = vue.ref('light')
  return {
    useTheme: () => ({
      mode: { store: refs.mockStoreRef },
      cycle: refs.mockCycle,
    }),
  }
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup()
    refs.mockStoreRef!.value = 'light'
    refs.mockCycle.mockClear()
  })

  it('renders Sun icon and correct aria-label when mode is "light"', async () => {
    refs.mockStoreRef!.value = 'light'
    await renderWithProviders(ThemeToggle, {})

    const button = screen.getByRole('button', { name: /light/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Theme: light')
  })

  it('renders Moon icon when mode is "dark"', async () => {
    refs.mockStoreRef!.value = 'dark'
    await renderWithProviders(ThemeToggle, {})

    const button = screen.getByRole('button', { name: /dark/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Theme: dark')
  })

  it('renders Monitor icon when mode is "auto"', async () => {
    refs.mockStoreRef!.value = 'auto'
    await renderWithProviders(ThemeToggle, {})

    const button = screen.getByRole('button', { name: /system/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Theme: system')
  })

  it('calls cycle() on click', async () => {
    await renderWithProviders(ThemeToggle, {})

    const button = screen.getByRole('button', { name: /light/i })
    await fireEvent.click(button)

    expect(refs.mockCycle).toHaveBeenCalledTimes(1)
  })
})
