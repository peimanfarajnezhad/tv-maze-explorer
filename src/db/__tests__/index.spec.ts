import { describe, it, expect, beforeEach } from 'vitest'
import { db, SYNC_META_ID, getSyncMeta, updateSyncMeta, bulkPutShows, getShowCount } from '../index'
import { makeShow } from '@/test-utils'

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
      await bulkPutShows([makeShow(1, 'Show A'), makeShow(2, 'Show B')])
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

    it('stores shows with _ratingSort and _premieredSort for DB-backed sorting', async () => {
      await bulkPutShows([
        makeShow(1, 'Low', { rating: { average: 5 }, premiered: '2020-01-01' }),
        makeShow(2, 'High', { rating: { average: 9 }, premiered: '2022-01-01' }),
      ])
      const show1 = await db.shows.get(1)
      const show2 = await db.shows.get(2)
      expect(show1?._ratingSort).toBe(5)
      expect(show1?._premieredSort).toBe('2020-01-01')
      expect(show2?._ratingSort).toBe(9)
      expect(show2?._premieredSort).toBe('2022-01-01')
      const byRating = await db.shows.orderBy('_ratingSort').reverse().toArray()
      expect(byRating.map((s) => s.name)).toEqual(['High', 'Low'])
      const byPremiered = await db.shows.orderBy('_premieredSort').reverse().toArray()
      expect(byPremiered.map((s) => s.name)).toEqual(['High', 'Low'])
    })
  })

  describe('getShowCount', () => {
    it('returns 0 when shows table is empty', async () => {
      const count = await getShowCount()
      expect(count).toBe(0)
    })
  })
})
