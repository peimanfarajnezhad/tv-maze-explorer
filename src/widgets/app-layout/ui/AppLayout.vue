<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <AppHeader>
      <template #sync-dialog-content>
        <slot name="sync-dialog-content" />
      </template>
    </AppHeader>
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
