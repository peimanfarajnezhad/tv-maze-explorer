<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

import type { TvmazeShow } from '@/types'
import { genreNameToSlug } from '@/lib/slug'
import { getGenreColorScheme } from '@/lib/genre-colors'
import ShowCard from '@/components/ShowCard.vue'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  genre: string
  shows: TvmazeShow[]
}>()

const scheme = computed(() => getGenreColorScheme(props.genre))
</script>

<template>
  <section class="space-y-3">
    <div
      class="relative flex items-center justify-between overflow-hidden rounded-xl border bg-linear-to-r to-transparent py-3 pl-5 pr-3"
      :class="[scheme.gradientFrom, scheme.border]"
    >
      <span class="absolute left-0 top-0 bottom-0 w-1" :class="scheme.stripe" />
      <h2 class="text-xl font-semibold" :class="scheme.text">{{ genre }}</h2>
      <Button variant="ghost" size="sm" as-child>
        <RouterLink
          :to="{
            name: 'genre-detail',
            params: {
              name: genreNameToSlug(genre),
            },
          }"
          class="flex items-center gap-1"
        >
          Show more
          <ChevronRight class="size-4" />
        </RouterLink>
      </Button>
    </div>

    <Carousel
      :opts="{
        align: 'start',
        loop: false,
        dragFree: true,
      }"
      v-slot="{ canScrollNext, canScrollPrev }"
      class="relative w-full"
    >
      <CarouselContent>
        <CarouselItem
          v-for="show in shows"
          :key="show.id"
          class="basis-[165px] md:basis-[175px] lg:basis-[195px]"
        >
          <ShowCard :show="show" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious
        v-show="canScrollPrev"
        class="absolute left-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 opacity-80 shadow-md backdrop-blur-sm transition-opacity hover:opacity-100 disabled:pointer-events-none"
      />
      <CarouselNext
        v-show="canScrollNext"
        class="absolute right-4 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 opacity-80 shadow-md backdrop-blur-sm transition-opacity hover:opacity-100 disabled:pointer-events-none"
      />
    </Carousel>
  </section>
</template>
