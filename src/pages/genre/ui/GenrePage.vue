<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'

import { useShowSyncStore } from '@/features/show-sync'
import { useShowsByGenre } from '@/entities/show'
import type { SortField } from '@/entities/show'
import { getGenreColorScheme } from '@/shared/lib/genre-colors'
import { ShowGrid } from '@/entities/show'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
const route = useRoute()
const router = useRouter()

const routeGenreParam = computed(() => {
  const name = (route.params.name as string) ?? ''
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : ''
})

const querySort = computed(() => {
  const s = route.query.sort as string
  return s === 'rating' || s === 'premiered' ? s : 'id'
})
const queryPage = computed(() => Math.max(1, Number(route.query.page) || 1))

const sortValue = ref<SortField>(querySort.value)

const showSyncStore = useShowSyncStore()
const { genreName, shows, totalCount, isLoading, notFound } = useShowsByGenre(routeGenreParam, {
  sortField: sortValue,
  page: queryPage,
})

const currentQuery = computed(() => ({
  ...(sortValue.value !== 'id' && { sort: sortValue.value }),
}))

const showSyncNotice = computed(() => showSyncStore.status !== 'completed')
const showSortAffectedNotice = computed(() => showSyncNotice.value && sortValue.value !== 'id')

const heroScheme = computed(() =>
  getGenreColorScheme(genreName.value || routeGenreParam.value || 'Genre'),
)

function onSortChange(value: unknown) {
  const next: SortField = value === 'rating' || value === 'premiered' ? value : 'id'
  sortValue.value = next
  router.replace({
    name: 'genre-detail',
    params: { name: route.params.name },
    query: currentQuery.value,
  })
}

function onPageChange(newPage: number) {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  router.replace({
    name: 'genre-detail',
    params: { name: route.params.name },
    query: { ...currentQuery.value, ...(newPage > 1 && { page: String(newPage) }) },
  })
}

onMounted(() => {
  sortValue.value = querySort.value
})

watch(querySort, (s) => {
  sortValue.value = s
})
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

    <header
      class="relative overflow-hidden rounded-2xl border bg-linear-to-r to-transparent py-8 pl-8 pr-6"
      :class="[heroScheme.gradientFrom, heroScheme.border]"
    >
      <!-- Left accent stripe -->
      <span class="absolute left-0 top-0 bottom-0 w-1" :class="heroScheme.stripe" />
      <!-- Oversized watermark text -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[8rem] font-black leading-none tracking-tighter sm:text-[10rem]"
        :class="heroScheme.watermark"
      >
        {{ genreName || routeGenreParam }}
      </span>
      <div class="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-3xl font-bold" :class="heroScheme.text">
          {{ genreName || routeGenreParam }}
        </h1>
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
    </header>

    <ShowGrid
      :shows="shows"
      :not-found="notFound"
      :loading="isLoading && !notFound"
      :page="queryPage"
      :total-count="totalCount"
      empty-title="No shows in this genre yet"
      empty-description="Try another genre or check back later."
      @update:page="onPageChange"
    />
  </main>
</template>
