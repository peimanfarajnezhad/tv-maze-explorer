import { useColorMode } from '@vueuse/core'
import { computed, watchEffect } from 'vue'

const THEME_COLOR_LIGHT = '#ffffff'
const THEME_COLOR_DARK = '#1a1a2e'

export function useTheme() {
  const mode = useColorMode({
    attribute: 'class',
    modes: { dark: 'dark', light: '' },
    storageKey: 'tv-maze-theme',
    initialValue: 'auto',
  })

  const isDark = computed(() => mode.value === 'dark')

  function cycle() {
    const order = ['light', 'dark', 'auto'] as const
    const idx = order.indexOf(mode.store.value as (typeof order)[number])
    mode.store.value = order[(idx + 1) % order.length]
  }

  watchEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute(
        'content',
        mode.value === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
      )
    }
  })

  return { mode, isDark, cycle }
}
