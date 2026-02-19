<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer
    class="border-t border-border bg-background/95 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur supports-backdrop-filter:bg-background/60"
  >
    <p>
      © {{ currentYear }} — Made with <span class="inline-block size-4 text-red-500">♥︎</span> · TV
      Maze Explorer
    </p>
  </footer>
</template>
