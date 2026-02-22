/**
 * Composable for genre list: all known genre names from IndexedDB.
 * Optionally re-fetches when refetchWhen changes (e.g. pass store.totalShowsStored from a feature).
 */

import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { getAllGenresFromDb } from '@/shared/db'
import { arraysEqual } from '@/shared/lib/arrays'

export interface UseAllGenresOptions {
  /** When this ref changes, genres are re-fetched (e.g. sync store totalShowsStored). */
  refetchWhen?: Ref<number>
}

export interface UseAllGenresReturn {
  genres: Ref<string[]>
  isLoading: Ref<boolean>
}

export function useAllGenres(options?: UseAllGenresOptions): UseAllGenresReturn {
  const genres = ref<string[]>([])
  const isLoading = ref(false)

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

  if (options?.refetchWhen) {
    watch(
      () => options.refetchWhen!.value,
      () => {
        debouncedLoad()
      },
    )
  }

  return { genres, isLoading }
}
