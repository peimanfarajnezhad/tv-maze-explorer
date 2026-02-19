/**
 * Composable for genre list: all known genre names from IndexedDB.
 * Re-fetches when showSyncStore.totalShowsStored changes so UI updates as sync progresses.
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'

import { db } from '@/db'
import { arraysEqual } from '@/lib/arrays'
import { useShowSyncStore } from '@/stores/show-sync'

export interface UseAllGenresReturn {
  genres: Ref<string[]>
  isLoading: Ref<boolean>
}

export function useAllGenres(): UseAllGenresReturn {
  const genres = ref<string[]>([]) as Ref<string[]>
  const isLoading = ref(false)

  const store = useShowSyncStore()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const all = await db.shows.toArray()
      const set = new Set<string>()
      for (const show of all) {
        for (const g of show.genres) set.add(g)
      }
      const next = Array.from(set).sort()
      // Only assign when the list actually changed to avoid unnecessary re-renders
      if (!arraysEqual(next, genres.value)) {
        genres.value = next
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    load()
  })

  watch(
    () => store.totalShowsStored,
    () => {
      load()
    },
  )

  return { genres, isLoading }
}
