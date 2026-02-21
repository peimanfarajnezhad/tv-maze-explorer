/**
 * Composable for genre page: one genre or "all", page-based pagination.
 * Resolves route param id (slug) to genre name and loads shows from IndexedDB.
 * Supports search by name and sort by id (default), rating, or premiered.
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'

import { db, getAllGenresFromDb } from '@/db'
import type { TvmazeShow } from '@/types'
import { genreNameToSlug, slugToGenreDisplayName } from '@/lib/slug'

export const PAGE_SIZE = 20

export type SortField = 'id' | 'rating' | 'premiered'

export interface UseShowsByGenreOptions {
  searchQuery?: Ref<string>
  sortField?: Ref<SortField>
  page?: Ref<number>
}

export interface UseShowsByGenreReturn {
  genreName: Ref<string>
  genreSlug: Ref<string | null>
  shows: Ref<TvmazeShow[]>
  totalCount: Ref<number>
  isLoading: Ref<boolean>
  notFound: Ref<boolean>
  error: Ref<string | null>
}

export function useShowsByGenre(
  routeId: Ref<string>,
  options: UseShowsByGenreOptions = {},
): UseShowsByGenreReturn {
  const searchQuery = options.searchQuery ?? ref('')
  const sortField = options.sortField ?? ref<SortField>('id')
  const page = options.page ?? ref(1)

  const genreName = ref('')
  const genreSlug = ref<string | null>(null)
  const shows = ref<TvmazeShow[]>([])
  const totalCount = ref(0)
  const isLoading = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)

  const state = {
    resolvedGenre: null as string | null,
    requestId: 0,
  }

  async function resolveGenre(slug: string): Promise<string | null> {
    const genres = await getAllGenresFromDb()
    return genres.find((g) => genreNameToSlug(g) === slug) ?? null
  }

  function searchFilter(q: string): (s: TvmazeShow) => boolean {
    if (!q.trim()) return () => true
    const lower = q.trim().toLowerCase()
    return (s) => s.name.toLowerCase().includes(lower)
  }

  async function loadPage(): Promise<void> {
    const id = routeId.value.toLowerCase()
    const q = searchQuery.value
    const sort = sortField.value
    const currentPage = Math.max(1, page.value)
    const offset = (currentPage - 1) * PAGE_SIZE

    const myRequestId = ++state.requestId
    isLoading.value = true
    error.value = null

    try {
      const isAll = !id || id === ''

      if (!isAll) {
        if (state.resolvedGenre === null || genreSlug.value !== id) {
          const resolved = await resolveGenre(id)
          if (myRequestId !== state.requestId) return
          if (!resolved) {
            notFound.value = true
            genreName.value = slugToGenreDisplayName(id)
            genreSlug.value = id
            shows.value = []
            totalCount.value = 0
            return
          }
          notFound.value = false
          state.resolvedGenre = resolved
          genreSlug.value = id
          genreName.value = resolved
        }
      } else {
        notFound.value = false
        state.resolvedGenre = null
        genreSlug.value = null
        genreName.value = 'All'
      }

      const bySearch = searchFilter(q)
      const sortKey =
        sort === 'rating' ? '_ratingSort' : sort === 'premiered' ? '_premieredSort' : 'id'
      const descending = sort !== 'id'

      let count: number
      let pageItems: TvmazeShow[]

      if (state.resolvedGenre) {
        const byGenre = db.shows.where('genres').equals(state.resolvedGenre)
        const withSearch = q.trim() ? byGenre.filter(bySearch) : byGenre
        const sorted = await withSearch.sortBy(sortKey)
        if (myRequestId !== state.requestId) return
        if (descending) sorted.reverse()
        count = sorted.length
        pageItems = sorted.slice(offset, offset + PAGE_SIZE)
      } else {
        const bySort = descending ? db.shows.orderBy(sortKey).reverse() : db.shows.orderBy(sortKey)
        const collection = q.trim() ? bySort.filter(bySearch) : bySort
        count = await collection.count()
        if (myRequestId !== state.requestId) return
        pageItems = await collection.offset(offset).limit(PAGE_SIZE).toArray()
        if (myRequestId !== state.requestId) return
      }

      shows.value = pageItems
      totalCount.value = count
    } catch (e) {
      if (myRequestId !== state.requestId) return
      const message = e instanceof Error ? e.message : String(e)
      error.value = message
      shows.value = []
      totalCount.value = 0
    } finally {
      if (myRequestId === state.requestId) {
        isLoading.value = false
      }
    }
  }

  onMounted(() => {
    loadPage()
  })

  watch([routeId, searchQuery, sortField, page], () => {
    if (routeId.value) {
      state.resolvedGenre = null
    }
    loadPage()
  })

  return {
    genreName,
    genreSlug,
    shows,
    totalCount,
    isLoading,
    notFound,
    error,
  }
}
