/**
 * IndexedDB layer for shows and sync metadata.
 * Uses Dexie for typed access and bulk operations.
 */

import Dexie, { type EntityTable } from 'dexie'
import type { TvmazeShow } from '@/types'

export const SYNC_META_ID = 'showSync'

export interface SyncMeta {
  id: string
  lastCompletedPage: number
  totalShowsStored: number
  estimatedTotalPages: number | null
  isCompleted: boolean
  isPaused: boolean
}

class TvMazeDb extends Dexie {
  shows!: EntityTable<TvmazeShow, 'id'>
  syncMeta!: EntityTable<SyncMeta, 'id'>

  constructor() {
    super('TvMazeDb')
    this.version(1).stores({
      shows: 'id, name',
      syncMeta: 'id',
    })
  }
}

export const db = new TvMazeDb()

export async function getSyncMeta(): Promise<SyncMeta | undefined> {
  return db.syncMeta.get(SYNC_META_ID)
}

export async function updateSyncMeta(partial: Partial<SyncMeta>): Promise<void> {
  const existing = await db.syncMeta.get(SYNC_META_ID)
  const next: SyncMeta = {
    id: SYNC_META_ID,
    lastCompletedPage: existing?.lastCompletedPage ?? -1,
    totalShowsStored: existing?.totalShowsStored ?? 0,
    estimatedTotalPages: existing?.estimatedTotalPages ?? null,
    isCompleted: existing?.isCompleted ?? false,
    isPaused: existing?.isPaused ?? false,
    ...partial,
  }
  await db.syncMeta.put(next)
}

export async function bulkPutShows(shows: TvmazeShow[]): Promise<void> {
  if (shows.length === 0) return
  await db.shows.bulkPut(shows)
}

export async function getShowCount(): Promise<number> {
  return db.shows.count()
}
