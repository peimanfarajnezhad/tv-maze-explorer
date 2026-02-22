<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

import { Button } from '@/shared/ui/button'
import { useTheme } from '@/features/theme'

const { mode, cycle } = useTheme()

const ariaLabel = computed(() => {
  const store = mode.store.value
  if (store === 'light') return 'Theme: light'
  if (store === 'dark') return 'Theme: dark'
  return 'Theme: system'
})

const IconComponent = computed(() => {
  const store = mode.store.value
  if (store === 'light') return Sun
  if (store === 'dark') return Moon
  return Monitor
})
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    type="button"
    class="text-muted-foreground"
    :aria-label="ariaLabel"
    @click="cycle()"
  >
    <component :is="IconComponent" class="size-5" aria-hidden="true" />
  </Button>
</template>
