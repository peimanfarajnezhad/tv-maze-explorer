import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import {
  mountComposable,
  clearDb,
  makeShow,
  makeCast,
  makeCrew,
  makeSeason,
  makeEpisode,
  waitUntil,
} from '@/test-utils'
import { useShowDetail } from '../use-show-detail'
import { db } from '@/db'
import * as tvmaze from '@/services/tvmaze'

vi.mock('@/services/tvmaze', () => ({
  getShow: vi.fn(),
}))

beforeEach(async () => {
  await clearDb()
  vi.mocked(tvmaze.getShow).mockReset()
})

describe('useShowDetail', () => {
  it('sets notFound when id is invalid', async () => {
    const showId = ref('abc')
    const { result } = mountComposable(() => useShowDetail(showId))

    await waitUntil(() => !result.isLoading.value)
    expect(result.notFound.value).toBe(true)
    expect(tvmaze.getShow).not.toHaveBeenCalled()
  })

  it('loads from IndexedDB then fetches full show with embeds', async () => {
    const cached = makeShow(1, 'Cached Show', { summary: 'From DB' })
    await db.shows.put(cached)

    const fullShow = {
      ...cached,
      _embedded: {
        cast: [makeCast(10, 'Actor One', 'Character A')],
        crew: [makeCrew(20, 'Director', 'Director')],
        seasons: [makeSeason(100, 1)],
        episodes: [makeEpisode(201, 1, 1, 'Pilot'), makeEpisode(202, 1, 2, 'Episode 2')],
      },
    }
    vi.mocked(tvmaze.getShow).mockResolvedValueOnce(fullShow)

    const showId = ref('1')
    const { result } = mountComposable(() => useShowDetail(showId))

    await waitUntil(() => !result.isLoading.value)

    expect(result.show.value?.name).toBe('Cached Show')
    expect(result.cast.value).toHaveLength(1)
    expect(result.cast.value[0]?.person.name).toBe('Actor One')
    expect(result.crew.value).toHaveLength(1)
    expect(result.seasons.value).toHaveLength(1)
    expect(result.episodesBySeason.value.get(1)).toHaveLength(2)
    expect(tvmaze.getShow).toHaveBeenCalledWith(1)
  })

  it('groups episodes by season number', async () => {
    vi.mocked(tvmaze.getShow).mockResolvedValueOnce({
      ...makeShow(1, 'Show'),
      _embedded: {
        episodes: [
          makeEpisode(1, 1, 1, 'S1E1'),
          makeEpisode(2, 1, 2, 'S1E2'),
          makeEpisode(3, 2, 1, 'S2E1'),
        ],
      },
    } as never)

    const showId = ref('1')
    const { result } = mountComposable(() => useShowDetail(showId))

    await waitUntil(() => !result.isLoading.value)

    expect(result.episodesBySeason.value.get(1)).toHaveLength(2)
    expect(result.episodesBySeason.value.get(2)).toHaveLength(1)
  })

  it('sets error and notFound when API fails and no cached show', async () => {
    vi.mocked(tvmaze.getShow).mockRejectedValueOnce(new Error('Network error'))

    const showId = ref('999')
    const { result } = mountComposable(() => useShowDetail(showId))

    await waitUntil(() => !result.isLoading.value)

    expect(result.notFound.value).toBe(true)
    expect(result.error.value).toBe('Network error')
  })

  it('keeps cached show and sets error when API fails after DB hit', async () => {
    const cached = makeShow(1, 'Cached')
    await db.shows.put(cached)
    vi.mocked(tvmaze.getShow).mockRejectedValueOnce(new Error('Timeout'))

    const showId = ref('1')
    const { result } = mountComposable(() => useShowDetail(showId))

    await waitUntil(() => !result.isLoading.value)

    expect(result.show.value?.name).toBe('Cached')
    expect(result.error.value).toBe('Timeout')
  })
})
