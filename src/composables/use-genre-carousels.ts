/**
 * Composable for home page: genres and up to 15 shows per genre (carousel data).
 * Source: IndexedDB. Re-runs when store totalShowsStored changes so UI updates as sync progresses.
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { db } from '@/db'
import type { TvmazeShow } from '@/types'
import { arraysEqual, carouselsEqual } from '@/lib/arrays'
import { useShowSyncStore } from '@/stores/show-sync'

const CAROUSEL_SIZE = 15

export interface GenreCarousel {
  genre: string
  shows: TvmazeShow[]
}

export interface UseGenreCarouselsReturn {
  genres: Ref<string[]>
  carousels: Ref<GenreCarousel[]>
  isLoading: Ref<boolean>
  load: () => Promise<void>
}

export function useGenreCarousels(): UseGenreCarouselsReturn {
  const genres = ref<string[]>([]) as Ref<string[]>
  const carousels = ref<GenreCarousel[]>([]) as Ref<GenreCarousel[]>
  const isLoading = ref(false)

  const store = useShowSyncStore()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const all = await db.shows.toArray()
      const byGenre = new Map<string, TvmazeShow[]>()
      for (const show of all) {
        for (const g of show.genres) {
          if (!byGenre.has(g)) byGenre.set(g, [])
          byGenre.get(g)!.push(show)
        }
      }
      const sortedGenres = Array.from(byGenre.keys()).sort()
      if (!arraysEqual(sortedGenres, genres.value)) {
        genres.value = sortedGenres
      }

      const rating = (s: TvmazeShow) => s.rating?.average ?? -1
      const nextCarousels = sortedGenres.map((genre) => {
        const list = byGenre.get(genre) ?? []
        const sorted = [...list].sort((a, b) => rating(b) - rating(a))
        return { genre, shows: sorted.slice(0, CAROUSEL_SIZE) }
      })
      if (!carouselsEqual(nextCarousels, carousels.value)) {
        carousels.value = nextCarousels
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    load()
  })

  const debouncedLoad = useDebounceFn(load, 500)

  watch(
    () => store.totalShowsStored,
    () => {
      debouncedLoad()
    },
  )

  return { genres, carousels, isLoading, load }
}
