<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { ref, computed, onMounted, watch } from 'vue'

import { useShowSyncStore } from '@/features/show-sync'
import { useShowsByGenre, type SortField } from '@/entities/show'
import { useAllGenres } from '@/entities/genre'
import { genreNameToSlug } from '@/shared/lib/slug'
import { ShowGrid } from '@/entities/show'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/ui/input-group'

const route = useRoute()
const router = useRouter()

const routeGenreParam = computed(() => (route.query.genre as string) ?? '')
const queryQ = computed(() => (route.query.q as string) ?? '')
const querySort = computed(() => {
  const s = route.query.sort as string
  return s === 'rating' || s === 'premiered' ? s : 'id'
})
const queryPage = computed(() => Math.max(1, Number(route.query.page) || 1))

const sortValue = ref<SortField>(querySort.value)

const showSyncStore = useShowSyncStore()
const { genres, isLoading: genresLoading } = useAllGenres({
  refetchWhen: computed(() => showSyncStore.totalShowsStored),
})
const { shows, totalCount, isLoading, notFound } = useShowsByGenre(routeGenreParam, {
  searchQuery: computed(() => queryQ.value),
  sortField: sortValue,
  page: queryPage,
})

const currentQuery = computed(() => {
  const q = route.query.q as string
  const genre = route.query.genre as string
  const sort = sortValue.value
  return {
    ...(q && { q }),
    ...(genre && { genre }),
    ...(sort !== 'id' && { sort }),
  }
})

function onPageChange(newPage: number) {
  router.replace({
    name: 'search',
    query: { ...currentQuery.value, ...(newPage > 1 && { page: String(newPage) }) },
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const showSyncNotice = computed(() => showSyncStore.status !== 'completed')
const showSortAffectedNotice = computed(() => showSyncNotice.value && sortValue.value !== 'id')

const genreSelectValue = computed(() => routeGenreParam.value || '__all__')

const searchInput = ref(queryQ.value)

function submitSearch() {
  const q = searchInput.value.trim()
  const next: Record<string, string> = { ...currentQuery.value }
  if (q) next.q = q
  else delete next.q
  delete next.page
  router.push({ name: 'search', query: next })
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    submitSearch()
  }
}

function clearSearch() {
  searchInput.value = ''
  const next: Record<string, string> = { ...currentQuery.value }
  delete next.q
  delete next.page
  router.replace({ name: 'search', query: next })
}

function onGenreChange(value: unknown) {
  const slug = value === '__all__' ? '' : (value as string)
  const next = { ...currentQuery.value }
  if (slug) next.genre = slug
  else delete next.genre
  router.push({ name: 'search', query: next })
}

function onSortChange(value: unknown) {
  const next: SortField = value === 'rating' || value === 'premiered' ? value : 'id'
  sortValue.value = next
  router.replace({
    name: 'search',
    query: currentQuery.value,
  })
}

onMounted(() => {
  sortValue.value = querySort.value
})

watch(querySort, (s) => {
  sortValue.value = s
})

watch(queryQ, (val) => {
  searchInput.value = val
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

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <InputGroup class="flex-1 min-w-0">
        <InputGroupAddon align="inline-start">
          <Search class="size-4 text-muted-foreground" aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          v-model="searchInput"
          type="search"
          placeholder="Search shows..."
          class="text-base"
          @keydown="onSearchKeydown"
        />
        <InputGroupAddon v-if="queryQ" align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <X class="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <Select
          :model-value="genreSelectValue"
          :disabled="genresLoading"
          @update:model-value="onGenreChange"
        >
          <SelectTrigger class="w-full sm:w-[200px]" aria-label="Filter by genre">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All genres</SelectItem>
            <SelectItem v-for="g in genres" :key="g" :value="genreNameToSlug(g)">
              {{ g }}
            </SelectItem>
          </SelectContent>
        </Select>
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
    </div>

    <ShowGrid
      :shows="shows"
      :not-found="notFound"
      :loading="isLoading && !notFound"
      :page="queryPage"
      :total-count="totalCount"
      empty-title="No shows match your filters"
      empty-description="Try a different search term, genre, or sort."
      @update:page="onPageChange"
    />
  </main>
</template>
