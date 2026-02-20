/**
 * Composable for genre list: all known genre names from IndexedDB.
 * Re-fetches when showSyncStore.totalShowsStored changes so UI updates as sync progresses.
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { getAllGenresFromDb } from '@/db'
import { arraysEqual } from '@/lib/arrays'
import { useShowSyncStore } from '@/stores/show-sync'

export interface UseAllGenresReturn {
  genres: Ref<string[]>
  isLoading: Ref<boolean>
}

export function useAllGenres(): UseAllGenresReturn {
  const genres = ref<string[]>([])
  const isLoading = ref(false)

  const store = useShowSyncStore()

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const next = await getAllGenresFromDb()
      // Only assign when the list actually changed to avoid unnecessary re-renders
      if (!arraysEqual(next, genres.value)) {
        genres.value.push(...next)
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

  return { genres, isLoading }
}
