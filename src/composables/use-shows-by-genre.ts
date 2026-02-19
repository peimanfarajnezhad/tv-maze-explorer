/**
 * Composable for genre page: one genre or "all", load-more pagination.
 * Resolves route param id (slug) to genre name and loads shows from IndexedDB.
 * Supports search by name and sort by id (default), rating, or premiered.
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'

import { db } from '@/db'
import type { TvmazeShow } from '@/types'
import { genreNameToSlug, slugToGenreDisplayName } from '@/lib/slug'

const PAGE_SIZE = 20

export type SortField = 'id' | 'rating' | 'premiered'

export interface UseShowsByGenreOptions {
  searchQuery?: Ref<string>
  sortField?: Ref<SortField>
}

export interface UseShowsByGenreReturn {
  genreName: Ref<string>
  genreSlug: Ref<string | null>
  shows: Ref<TvmazeShow[]>
  hasMore: Ref<boolean>
  isLoading: Ref<boolean>
  loadMore: () => Promise<void>
  notFound: Ref<boolean>
}

export function useShowsByGenre(
  routeId: Ref<string>,
  options: UseShowsByGenreOptions = {},
): UseShowsByGenreReturn {
  const searchQuery = options.searchQuery ?? ref('')
  const sortField = options.sortField ?? ref<SortField>('id')

  const genreName = ref('') as Ref<string>
  const genreSlug = ref<string | null>(null) as Ref<string | null>
  const shows = ref<TvmazeShow[]>([]) as Ref<TvmazeShow[]>
  const hasMore = ref(true)
  const isLoading = ref(false)
  const notFound = ref(false)

  let offset = 0
  let resolvedGenre: string | null = null

  async function resolveGenre(slug: string): Promise<string | null> {
    const all = await db.shows.toArray()
    const set = new Set<string>()
    for (const show of all) {
      for (const g of show.genres) set.add(g)
    }
    const genres = Array.from(set)
    const found = genres.find((g) => genreNameToSlug(g) === slug)
    return found ?? null
  }

  function genreFilter(genre: string | null): (s: TvmazeShow) => boolean {
    if (!genre) return () => true
    return (s) => s.genres.includes(genre)
  }

  function searchFilter(q: string): (s: TvmazeShow) => boolean {
    if (!q.trim()) return () => true
    const lower = q.trim().toLowerCase()
    return (s) => s.name.toLowerCase().includes(lower)
  }

  async function loadPage(append: boolean): Promise<void> {
    const id = routeId.value
    const q = searchQuery.value
    const sort = sortField.value

    isLoading.value = true
    try {
      const isAll = !id || id === ''

      if (!isAll) {
        if (resolvedGenre === null || genreSlug.value !== id) {
          const resolved = await resolveGenre(id)
          if (!resolved) {
            notFound.value = true
            genreName.value = slugToGenreDisplayName(id)
            genreSlug.value = id
            shows.value = []
            hasMore.value = false
            return
          }
          notFound.value = false
          resolvedGenre = resolved
          genreSlug.value = id
          genreName.value = resolved
          offset = 0
          if (!append) shows.value = []
        }
      } else {
        notFound.value = false
        resolvedGenre = null
        genreSlug.value = null
        genreName.value = 'All'
        offset = 0
        if (!append) shows.value = []
      }

      const byGenre = genreFilter(resolvedGenre)
      const bySearch = searchFilter(q)

      if (sort === 'id') {
        const collection = db.shows.orderBy('id').filter(byGenre).filter(bySearch)
        const count = await collection.count()
        const page = await collection.offset(offset).limit(PAGE_SIZE).toArray()
        if (append) {
          shows.value = [...shows.value, ...page]
        } else {
          shows.value = page
        }
        offset += page.length
        hasMore.value = offset < count
      } else {
        const collection = db.shows.filter(byGenre).filter(bySearch)
        const all = await collection.toArray()
        const sorted =
          sort === 'rating'
            ? [...all].sort((a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1))
            : [...all].sort((a, b) => {
                const ad = a.premiered ?? ''
                const bd = b.premiered ?? ''
                return bd.localeCompare(ad)
              })
        const page = sorted.slice(offset, offset + PAGE_SIZE)
        if (append) {
          shows.value = [...shows.value, ...page]
        } else {
          shows.value = page
        }
        offset += page.length
        hasMore.value = offset < sorted.length
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || isLoading.value) return
    await loadPage(true)
  }

  onMounted(() => {
    loadPage(false)
  })

  watch(
    [routeId, searchQuery, sortField],
    () => {
      if (routeId.value) {
        resolvedGenre = null
      }
      offset = 0
      loadPage(false)
    },
    { deep: true },
  )

  return {
    genreName,
    genreSlug,
    shows,
    hasMore,
    isLoading,
    loadMore,
    notFound,
  }
}
