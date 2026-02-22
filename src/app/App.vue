<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { DatabaseZap } from 'lucide-vue-next'

import { CONFIG } from '@/shared/config'
import { useShowSyncStore } from '@/features/show-sync'
import { AppLayout } from '@/widgets/app-layout'
import { ShowSyncDashboard } from '@/widgets/show-sync-dashboard'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'

const showSyncStore = useShowSyncStore()
const maxWaitElapsed = ref(false)
let maxWaitTimer: ReturnType<typeof setTimeout> | null = null

const appReady = computed(() => showSyncStore.isReady || maxWaitElapsed.value)

onMounted(async () => {
  await showSyncStore.initialize()
  if (showSyncStore.isReady) return
  maxWaitTimer = setTimeout(() => {
    maxWaitElapsed.value = true
    maxWaitTimer = null
  }, CONFIG.INITIAL_MAX_WAIT_MS)
})

onUnmounted(() => {
  if (maxWaitTimer != null) {
    clearTimeout(maxWaitTimer)
    maxWaitTimer = null
  }
})
</script>

<template>
  <AppLayout>
    <template #sync-dialog-content>
      <ShowSyncDashboard />
    </template>
    <RouterView v-if="appReady" />
    <Empty v-else-if="showSyncStore.isInitialized">
      <EmptyHeader class="mt-8">
        <div class="relative flex items-center justify-center mb-4">
          <div
            class="absolute size-16 animate-spin rounded-full border-2 border-muted border-t-primary"
          />
          <EmptyMedia variant="icon" class="mb-0">
            <DatabaseZap class="size-6" />
          </EmptyMedia>
        </div>
        <EmptyTitle>Preparing your catalog&hellip;</EmptyTitle>
        <EmptyDescription> This only takes a moment on first visit </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </AppLayout>
</template>
