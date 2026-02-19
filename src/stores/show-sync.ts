/**
 * Pinia store for show sync state.
 * Wraps ShowSyncEngine with reactive state for the UI.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { getSyncMeta, updateSyncMeta } from '@/db'
import { ShowSyncEngine } from '@/services/show-sync-engine'

export type SyncStatus =
  | 'idle'
  | 'probing'
  | 'syncing'
  | 'paused'
  | 'completed'
  | 'error'

export const useShowSyncStore = defineStore('showSync', () => {
  const status = ref<SyncStatus>('idle')
  const currentPage = ref(0)
  const totalShowsStored = ref(0)
  const estimatedTotalPages = ref<number | null>(null)
  const lastCompletedPage = ref(-1)
  const pagesPerSecond = ref(0)
  const estimatedTimeRemainingMs = ref<number | null>(null)
  const errorMessage = ref<string | null>(null)
  const startedAt = ref<number | null>(null)

  const progressPercent = computed<number | null>(() => {
    const total = estimatedTotalPages.value
    const last = lastCompletedPage.value
    if (total == null || total <= 0 || last < 0) return null
    return Math.min(100, Math.round(((last + 1) / total) * 100))
  })

  const formattedETA = computed(() => {
    const ms = estimatedTimeRemainingMs.value
    if (ms == null || ms <= 0) return '—'
    const sec = Math.ceil(ms / 1000)
    if (sec < 60) return `~${sec} sec`
    const min = Math.floor(sec / 60)
    const s = sec % 60
    return s > 0 ? `~${min} min ${s} sec` : `~${min} min`
  })

  let engine: ShowSyncEngine | null = null

  function setProgress(p: {
    currentPage: number
    lastCompletedPage: number
    totalShowsStored: number
    estimatedTotalPages: number | null
    pagesPerSecond: number
    estimatedTimeRemainingMs: number | null
  }) {
    currentPage.value = p.currentPage
    lastCompletedPage.value = p.lastCompletedPage
    totalShowsStored.value = p.totalShowsStored
    estimatedTotalPages.value = p.estimatedTotalPages
    pagesPerSecond.value = p.pagesPerSecond
    estimatedTimeRemainingMs.value = p.estimatedTimeRemainingMs
  }

  function startEngine() {
    if (engine) return
    updateSyncMeta({ isPaused: false })
    status.value = 'probing'
    errorMessage.value = null
    startedAt.value = Date.now()
    engine = new ShowSyncEngine({
      onProgress: (p) => {
        setProgress(p)
        if (status.value === 'probing') status.value = 'syncing'
      },
      onComplete: () => {
        status.value = 'completed'
        estimatedTimeRemainingMs.value = null
        engine?.dispose()
        engine = null
      },
      onError: (message) => {
        status.value = 'error'
        errorMessage.value = message
        estimatedTimeRemainingMs.value = null
        engine?.dispose()
        engine = null
      },
    })
    engine.start()
  }

  async function initialize() {
    const meta = await getSyncMeta()
    if (meta?.isCompleted) {
      status.value = 'completed'
      lastCompletedPage.value = meta.lastCompletedPage
      totalShowsStored.value = meta.totalShowsStored
      estimatedTotalPages.value = meta.estimatedTotalPages
      return
    }
    if (meta?.isPaused) {
      status.value = 'paused'
      lastCompletedPage.value = meta.lastCompletedPage
      totalShowsStored.value = meta.totalShowsStored
      estimatedTotalPages.value = meta.estimatedTotalPages
      return
    }
    startEngine()
  }

  function pause() {
    if (engine) {
      engine.pause()
      status.value = 'paused'
      updateSyncMeta({ isPaused: true })
    }
  }

  function resume() {
    if (engine) {
      engine.resume()
      status.value = 'syncing'
      updateSyncMeta({ isPaused: false })
    } else if (status.value === 'paused') {
      startEngine()
    }
  }

  function retry() {
    if (status.value !== 'error') return
    errorMessage.value = null
    startEngine()
  }

  return {
    status,
    currentPage,
    totalShowsStored,
    estimatedTotalPages,
    lastCompletedPage,
    pagesPerSecond,
    estimatedTimeRemainingMs,
    errorMessage,
    startedAt,
    progressPercent,
    formattedETA,
    initialize,
    pause,
    resume,
    retry,
  }
})
