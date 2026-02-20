/**
 * IndexedDB layer for shows and sync metadata.
 * Uses Dexie for typed access and bulk operations.
 */

import Dexie, { type EntityTable } from 'dexie'
import type { TvmazeShow } from '@/types'

export const SYNC_META_ID = 'showSync'

/** Stored show shape: TvmazeShow plus sort keys for DB-backed ordering. */
export interface StoredTvmazeShow extends TvmazeShow {
  _ratingSort: number
  _premieredSort: string
}

export interface SyncMeta {
  id: string
  lastCompletedPage: number
  totalShowsStored: number
  estimatedTotalPages: number | null
  isCompleted: boolean
  isPaused: boolean
}

export function toStoredShow(show: TvmazeShow): StoredTvmazeShow {
  return {
    ...show,
    _ratingSort: show.rating?.average ?? -1,
    _premieredSort: show.premiered ?? '1900-01-01',
  }
}

class TvMazeDb extends Dexie {
  shows!: EntityTable<StoredTvmazeShow, 'id'>
  syncMeta!: EntityTable<SyncMeta, 'id'>

  constructor() {
    super('TvMazeDb')
    this.version(1).stores({
      shows: 'id, name',
      syncMeta: 'id',
    })
    this.version(2).stores({
      shows: 'id, name, *genres',
      syncMeta: 'id',
    })
    this.version(3)
      .stores({
        shows: 'id, name, *genres, _ratingSort, _premieredSort',
        syncMeta: 'id',
      })
      .upgrade((trans) => {
        trans
          .table('shows')
          .toCollection()
          .modify((show: TvmazeShow & Record<string, unknown>) => {
            show._ratingSort = show.rating?.average ?? -1
            show._premieredSort = show.premiered ?? '1900-01-01'
          })
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
  const stored = shows.map(toStoredShow)
  await db.shows.bulkPut(stored)
}

export async function getShowCount(): Promise<number> {
  return db.shows.count()
}

/**
 * Returns all unique genre names from the shows table.
 * Uses the *genres multi-entry index for efficient iteration.
 */
export async function getAllGenresFromDb(): Promise<string[]> {
  const keys = await db.shows.orderBy('genres').uniqueKeys()
  return (keys as string[]).filter(Boolean).sort()
}
