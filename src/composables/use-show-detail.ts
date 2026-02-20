/**
 * Composable for show detail page: instant data from IndexedDB, then full data
 * (cast, crew, seasons, episodes, images) from a single API call with embeds.
 */

import { ref, watch, type Ref } from 'vue'

import { db } from '@/db'
import { getShow } from '@/services/tvmaze'
import type { TvmazeShow, TvmazeCast, TvmazeCrew, TvmazeSeason, TvmazeEpisode } from '@/types'

export interface UseShowDetailReturn {
  show: Ref<TvmazeShow | null>
  cast: Ref<TvmazeCast[]>
  crew: Ref<TvmazeCrew[]>
  seasons: Ref<TvmazeSeason[]>
  episodesBySeason: Ref<Map<number, TvmazeEpisode[]>>
  backgroundImage: Ref<string | null>
  posterImage: Ref<string | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  notFound: Ref<boolean>
}

/** Prefer only landscape/background-type images for backdrop; fall back to main show image if none. */
function pickBackgroundImage(show: TvmazeShow): string | null {
  const images = show._embedded?.images
  if (images?.length) {
    const background = images.find((img) => img.type === 'background')
    const url = background?.resolutions?.original?.url ?? background?.resolutions?.medium?.url
    if (url) return url
  }
  return show.image?.original ?? show.image?.medium ?? null
}

/** Standard vertical poster (2:3) for the poster card. */
function pickPosterImage(show: TvmazeShow): string | null {
  return show.image?.medium ?? show.image?.original ?? null
}

function groupEpisodesBySeason(episodes: TvmazeEpisode[]): Map<number, TvmazeEpisode[]> {
  const map = new Map<number, TvmazeEpisode[]>()
  for (const ep of episodes) {
    const list = map.get(ep.season) ?? []
    list.push(ep)
    map.set(ep.season, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
  }
  return map
}

export function useShowDetail(showId: Ref<string | number>): UseShowDetailReturn {
  const show = ref<TvmazeShow | null>(null)
  const cast = ref<TvmazeCast[]>([])
  const crew = ref<TvmazeCrew[]>([])
  const seasons = ref<TvmazeSeason[]>([])
  const episodesBySeason = ref<Map<number, TvmazeEpisode[]>>(new Map())
  const backgroundImage = ref<string | null>(null)
  const posterImage = ref<string | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const notFound = ref(false)

  async function load(id: string | number) {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id
    if (Number.isNaN(numId) || numId < 1) {
      notFound.value = true
      isLoading.value = false
      return
    }

    notFound.value = false
    error.value = null
    isLoading.value = true
    show.value = null
    cast.value = []
    crew.value = []
    seasons.value = []
    episodesBySeason.value = new Map()
    backgroundImage.value = null
    posterImage.value = null

    try {
      const fromDb = await db.shows.get(numId)
      if (fromDb) {
        show.value = { ...fromDb }
      }

      const full = await getShow(numId)
      show.value = full
      cast.value = full._embedded?.cast ?? []
      crew.value = full._embedded?.crew ?? []
      seasons.value = full._embedded?.seasons ?? []
      episodesBySeason.value = groupEpisodesBySeason(full._embedded?.episodes ?? [])
      backgroundImage.value = pickBackgroundImage(full)
      posterImage.value = pickPosterImage(full)
    } catch (e) {
      if (!show.value) {
        notFound.value = true
      }
      error.value = e instanceof Error ? e.message : 'Failed to load show'
    } finally {
      isLoading.value = false
    }
  }

  watch(
    showId,
    (id) => {
      if (id !== undefined && id !== '') load(id)
    },
    { immediate: true },
  )

  return {
    show,
    cast,
    crew,
    seasons,
    episodesBySeason,
    backgroundImage,
    posterImage,
    isLoading,
    error,
    notFound,
  }
}
