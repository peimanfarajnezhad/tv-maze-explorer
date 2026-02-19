<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useShowSyncStore } from '@/stores/show-sync'
import { useGenreCarousels } from '@/composables/use-genre-carousels'
import GenreCarousel from '@/components/GenreCarousel.vue'
import HomeGallerySkeleton from '@/components/HomeGallerySkeleton.vue'

const INITIAL_DELAY_MS = 1800

const showSyncStore = useShowSyncStore()
const { carousels, isLoading } = useGenreCarousels()

const allowRender = ref(false)

const isEmptyAndSyncing = () =>
  showSyncStore.totalShowsStored === 0 &&
  (showSyncStore.status === 'probing' || showSyncStore.status === 'syncing')

const showSkeleton = () =>
  !allowRender.value || (allowRender.value && isLoading.value && carousels.value.length === 0)

const showContent = () => allowRender.value && (carousels.value.length > 0 || !isLoading.value)

let delayTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!isEmptyAndSyncing()) {
    allowRender.value = true
    return
  }
  delayTimer = setTimeout(() => {
    allowRender.value = true
    delayTimer = null
  }, INITIAL_DELAY_MS)
})

onUnmounted(() => {
  if (delayTimer != null) clearTimeout(delayTimer)
})

watch(
  () => showSyncStore.totalShowsStored,
  (count) => {
    if (count > 0 && !allowRender.value) allowRender.value = true
  },
)
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-8 py-8 px-4">
    <template v-if="showSkeleton()">
      <HomeGallerySkeleton />
    </template>

    <template v-else-if="showContent()">
      <template v-if="carousels.length > 0">
        <GenreCarousel
          v-for="item in carousels"
          :key="item.genre"
          :genre="item.genre"
          :shows="item.shows"
        />
      </template>
      <p v-else class="text-muted-foreground">
        No shows yet. Sync in progress or no data in database.
      </p>
    </template>
  </main>
</template>
