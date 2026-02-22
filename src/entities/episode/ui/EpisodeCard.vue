<script setup lang="ts">
import { computed } from 'vue'
import type { TvmazeEpisode } from '@/shared/types'
import { Card, CardContent } from '@/shared/ui/card'

const props = defineProps<{
  episode: TvmazeEpisode
}>()

const formattedAirdate = computed(() => {
  const airdate = props.episode.airdate
  if (!airdate) return '—'
  try {
    const d = new Date(airdate)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return airdate
  }
})
</script>

<template>
  <Card class="overflow-hidden py-0 pb-4 transition-shadow hover:shadow-md full-width">
    <div class="aspect-video w-full overflow-hidden bg-muted">
      <img
        v-if="episode.image?.original"
        :src="episode.image.original"
        :alt="episode.name"
        class="size-full object-cover"
        loading="lazy"
      />
      <img
        v-else-if="episode.image?.medium"
        :src="episode.image.medium"
        :alt="episode.name"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="flex aspect-video items-center justify-center text-muted-foreground text-sm"
      >
        No image
      </div>
    </div>
    <CardContent>
      <p class="text-xs text-muted-foreground">S{{ episode.season }} · E{{ episode.number }}</p>
      <p class="mt-0.5 line-clamp-2 font-medium" :title="episode.name">
        {{ episode.name }}
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ formattedAirdate }}
      </p>
    </CardContent>
  </Card>
</template>
