<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { TvmazeShow } from '@/types'
import { Card } from '@/components/ui/card'
import { StarIcon } from 'lucide-vue-next'

defineProps<{
  show: TvmazeShow
}>()

function formatRating(show: TvmazeShow): string {
  const avg = show.rating?.average
  return avg != null ? avg.toFixed(1) : '—'
}
</script>

<template>
  <RouterLink :to="{ name: 'show-detail', params: { id: show.id } }" class="block">
    <Card
      class="w-[130px] py-0 shrink-0 overflow-hidden transition-shadow hover:shadow-md sm:w-[150px] md:w-[160px] lg:w-[180px]"
    >
      <div class="aspect-2/3 w-full overflow-hidden bg-muted relative">
        <img
          v-if="show.image?.medium"
          :src="show.image.medium"
          :alt="show.name"
          class="size-full object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="flex size-full items-center justify-center text-muted-foreground text-xs sm:text-sm"
        >
          No image
        </div>
        <div
          class="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 text-white text-xs sm:p-2 sm:text-sm"
        >
          <div class="flex items-center gap-1">
            <StarIcon class="size-3.5 shrink-0 text-yellow-500 sm:size-4" />
            <span>{{ formatRating(show) }}</span>
          </div>
        </div>
      </div>
    </Card>
  </RouterLink>
</template>
