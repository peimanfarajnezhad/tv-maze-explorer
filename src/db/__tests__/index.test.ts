import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  SYNC_META_ID,
  getSyncMeta,
  updateSyncMeta,
  bulkPutShows,
  getShowCount,
} from '../index'
import type { TvmazeShow } from '@/types'

function makeShow(id: number, name: string): TvmazeShow {
  return {
    id,
    name,
    url: `https://example.com/${id}`,
    type: 'Scripted',
    language: 'English',
    genres: [],
    status: 'Running',
    runtime: 60,
    averageRuntime: 60,
    premiered: '2020-01-01',
    ended: null,
    officialSite: null,
    schedule: { time: '20:00', days: ['Monday'] },
    rating: { average: 8 },
    weight: 1,
    network: null,
    webChannel: null,
    dvdCountry: null,
    externals: { tvrage: null, thetvdb: null, imdb: null },
    image: null,
    summary: null,
    updated: 1,
    _links: { self: { href: '' } },
  } as TvmazeShow
}

describe('db', () => {
  beforeEach(async () => {
    await db.syncMeta.clear()
    await db.shows.clear()
  })

  describe('getSyncMeta', () => {
    it('returns undefined when no meta exists', async () => {
      const meta = await getSyncMeta()
      expect(meta).toBeUndefined()
    })

    it('returns existing meta after updateSyncMeta', async () => {
      await updateSyncMeta({
        lastCompletedPage: 2,
        totalShowsStored: 100,
        estimatedTotalPages: 10,
        isCompleted: false,
        isPaused: false,
      })
      const meta = await getSyncMeta()
      expect(meta).toEqual({
        id: SYNC_META_ID,
        lastCompletedPage: 2,
        totalShowsStored: 100,
        estimatedTotalPages: 10,
        isCompleted: false,
        isPaused: false,
      })
    })
  })

  describe('updateSyncMeta', () => {
    it('creates meta with defaults when none exists', async () => {
      await updateSyncMeta({ lastCompletedPage: 0 })

      const meta = await getSyncMeta()
      expect(meta).toMatchObject({
        id: SYNC_META_ID,
        lastCompletedPage: 0,
        totalShowsStored: 0,
        estimatedTotalPages: null,
        isCompleted: false,
        isPaused: false,
      })
    })

    it('merges partial over existing meta', async () => {
      await updateSyncMeta({
        lastCompletedPage: 1,
        totalShowsStored: 50,
        estimatedTotalPages: 5,
      })
      await updateSyncMeta({ lastCompletedPage: 2, totalShowsStored: 60 })

      const meta = await getSyncMeta()
      expect(meta).toMatchObject({
        lastCompletedPage: 2,
        totalShowsStored: 60,
        estimatedTotalPages: 5,
      })
    })
  })

  describe('bulkPutShows', () => {
    it('does nothing when given empty array', async () => {
      await bulkPutShows([])
      const count = await getShowCount()
      expect(count).toBe(0)
    })

    it('stores shows and getShowCount returns correct count', async () => {
      await bulkPutShows([
        makeShow(1, 'Show A'),
        makeShow(2, 'Show B'),
      ])
      const count = await getShowCount()
      expect(count).toBe(2)
    })

    it('upserts by id so duplicate id overwrites', async () => {
      await bulkPutShows([makeShow(1, 'First')])
      await bulkPutShows([makeShow(1, 'Second')])
      const count = await getShowCount()
      expect(count).toBe(1)
      const show = await db.shows.get(1)
      expect(show?.name).toBe('Second')
    })
  })

  describe('getShowCount', () => {
    it('returns 0 when shows table is empty', async () => {
      const count = await getShowCount()
      expect(count).toBe(0)
    })
  })
})
