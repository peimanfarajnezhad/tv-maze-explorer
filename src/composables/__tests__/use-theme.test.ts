import { describe, it, expect, vi } from 'vitest'
import { mountComposable } from '@/test-utils'
import { useTheme } from '../use-theme'

vi.mock('@vueuse/core', async () => {
  const vue = await vi.importActual<typeof import('vue')>('vue')
  return {
    useColorMode: () => {
      const store = vue.ref('light')
      return Object.assign(store, {
        store,
        system: vue.computed(() => 'light' as const),
      })
    },
  }
})

describe('useTheme', () => {
  it('returns reactive mode, isDark, and cycle function', () => {
    const { result } = mountComposable(() => useTheme())

    expect(result.mode).toBeDefined()
    expect(result.mode.value).toBeDefined()
    expect(result.mode.store).toBeDefined()
    expect(result.isDark).toBeDefined()
    expect(typeof result.cycle).toBe('function')
  })

  it('isDark is true when mode resolves to "dark"', () => {
    const { result } = mountComposable(() => useTheme())
    result.mode.store.value = 'dark'

    expect(result.isDark.value).toBe(true)
  })

  it('isDark is false when mode resolves to "light"', () => {
    const { result } = mountComposable(() => useTheme())

    expect(result.isDark.value).toBe(false)
  })

  it('cycle() rotates through light -> dark -> auto', () => {
    const { result } = mountComposable(() => useTheme())

    result.cycle()
    expect(result.mode.store.value).toBe('dark')

    result.cycle()
    expect(result.mode.store.value).toBe('auto')

    result.cycle()
    expect(result.mode.store.value).toBe('light')
  })

  it('cycle() wraps from auto back to light', () => {
    const { result } = mountComposable(() => useTheme())
    result.mode.store.value = 'auto'

    result.cycle()
    expect(result.mode.store.value).toBe('light')
  })
})
