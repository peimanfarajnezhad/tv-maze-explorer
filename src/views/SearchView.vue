<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import { ref, computed, onMounted, watch } from 'vue'

import { useShowSyncStore } from '@/stores/show-sync'
import { useShowsByGenre, PAGE_SIZE } from '@/composables/use-shows-by-genre'
import { useAllGenres } from '@/composables/use-all-genres'
import type { SortField } from '@/composables/use-shows-by-genre'
import { genreNameToSlug } from '@/lib/slug'
import ShowCard from '@/components/ShowCard.vue'
import ShowCardSkeleton from '@/components/ShowCardSkeleton.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

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
const { genres, isLoading: genresLoading } = useAllGenres()
const { shows, totalCount, isLoading, notFound } = useShowsByGenre(routeGenreParam, {
  searchQuery: computed(() => queryQ.value),
  sortField: sortValue,
  page: queryPage,
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

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

const showSkeleton = computed(() => isLoading.value && shows.value.length === 0 && !notFound.value)

const showSyncNotice = computed(() => showSyncStore.status !== 'completed')
const showSortAffectedNotice = computed(() => showSyncNotice.value && sortValue.value !== 'id')

const genreSelectValue = computed(() => routeGenreParam.value || '__all__')

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

function clearSearch() {
  const rest = { ...route.query }
  delete rest.q
  router.replace({ name: 'search', query: rest })
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

    <div v-if="queryQ" class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">Searching:</span>
      <span
        class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-sm"
      >
        {{ queryQ }}
        <button
          type="button"
          class="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <X class="size-4" />
        </button>
      </span>
    </div>

    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

    <Empty v-if="notFound">
      <EmptyHeader>
        <EmptyTitle>Genre not found</EmptyTitle>
        <EmptyDescription
          >The genre you're looking for doesn't exist or has no shows.</EmptyDescription
        >
      </EmptyHeader>
    </Empty>

    <template v-else-if="showSkeleton">
      <div class="flex flex-wrap justify-center gap-4">
        <ShowCardSkeleton v-for="i in 10" :key="i" />
      </div>
    </template>

    <template v-else>
      <div class="flex flex-wrap justify-center gap-4">
        <ShowCard v-for="show in shows" :key="show.id" :show="show" />
      </div>

      <div v-if="totalPages > 1" class="flex justify-center pt-4">
        <Pagination
          :page="queryPage"
          :total="totalCount"
          :items-per-page="PAGE_SIZE"
          :sibling-count="1"
          @update:page="onPageChange"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst />
            <PaginationPrevious />
            <template v-for="(item, idx) in items" :key="idx">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === queryPage"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else />
            </template>
            <PaginationNext />
            <PaginationLast />
          </PaginationContent>
        </Pagination>
      </div>

      <Empty v-else-if="shows.length === 0">
        <EmptyHeader>
          <EmptyTitle>No shows match your filters</EmptyTitle>
          <EmptyDescription>Try a different search term, genre, or sort.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </template>
  </main>
</template>
