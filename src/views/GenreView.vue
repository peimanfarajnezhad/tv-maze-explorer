<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

import { useShowSyncStore } from '@/stores/show-sync'
import { useShowsByGenre } from '@/composables/use-shows-by-genre'
import type { SortField } from '@/composables/use-shows-by-genre'
import ShowCard from '@/components/ShowCard.vue'
import ShowCardSkeleton from '@/components/ShowCardSkeleton.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const INITIAL_DELAY_MS = 1500

const route = useRoute()
const router = useRouter()

const routeGenreParam = computed(() => (route.params.name as string) ?? '')
const querySort = computed(() => {
  const s = route.query.sort as string
  return s === 'rating' || s === 'premiered' ? s : 'id'
})

const sortValue = ref<SortField>(querySort.value)

const showSyncStore = useShowSyncStore()
const { genreName, shows, hasMore, isLoading, loadMore, notFound } = useShowsByGenre(
  routeGenreParam,
  {
    sortField: sortValue,
  },
)

const allowRender = ref(false)
const isEmptyAndSyncing = computed(
  () =>
    showSyncStore.totalShowsStored === 0 &&
    (showSyncStore.status === 'probing' || showSyncStore.status === 'syncing'),
)

const currentQuery = computed(() => ({
  ...(sortValue.value !== 'id' && { sort: sortValue.value }),
}))

const showSkeleton = computed(
  () =>
    !allowRender.value ||
    (allowRender.value && isLoading.value && shows.value.length === 0 && !notFound.value),
)

const showSyncNotice = computed(() => showSyncStore.status !== 'completed')
const showSortAffectedNotice = computed(() => showSyncNotice.value && sortValue.value !== 'id')

function onSortChange(value: unknown) {
  const next: SortField = value === 'rating' || value === 'premiered' ? value : 'id'
  sortValue.value = next
  router.replace({
    name: 'genre-detail',
    params: { name: route.params.name },
    query: currentQuery.value,
  })
}

let delayTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  sortValue.value = querySort.value
  if (!isEmptyAndSyncing.value) {
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

watch(querySort, (s) => {
  sortValue.value = s
})

watch(
  () => showSyncStore.totalShowsStored,
  (count) => {
    if (count > 0 && !allowRender.value) allowRender.value = true
  },
)
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-6 py-8 px-4">
    <Alert v-if="showSyncNotice" variant="warning">
      <AlertDescription>
        Sync in progress or incomplete. Results may be limited.
        <span v-if="showSortAffectedNotice">
          Sorted order (Rating or Premiered) may change as more data is synced.</span
        >
      </AlertDescription>
    </Alert>

    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold">{{ genreName || routeGenreParam }}</h1>
      <Select :model-value="sortValue" @update:model-value="onSortChange">
        <SelectTrigger class="w-full sm:w-[180px]" aria-label="Sort by">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id">ID</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
          <SelectItem value="premiered">Premiered</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <template v-if="notFound">
      <p class="text-muted-foreground">Genre not found.</p>
    </template>

    <template v-else-if="showSkeleton">
      <div class="flex flex-wrap justify-center gap-4">
        <ShowCardSkeleton v-for="i in 10" :key="i" />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-wrap justify-center gap-4">
        <ShowCard v-for="show in shows" :key="show.id" :show="show" />
      </div>

      <div v-if="hasMore || isLoading" class="flex justify-center pt-4">
        <Button variant="outline" size="lg" :disabled="isLoading || !hasMore" @click="loadMore()">
          <Loader2 v-if="isLoading" class="mr-2 size-4 animate-spin" />
          {{ isLoading ? 'Loading...' : 'Load more' }}
        </Button>
      </div>

      <p v-else-if="shows.length === 0" class="text-muted-foreground">
        No shows in this genre yet.
      </p>
    </template>
  </main>
</template>
