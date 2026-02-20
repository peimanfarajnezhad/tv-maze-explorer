<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRightIcon } from 'lucide-vue-next'

import { genreNameToSlug } from '@/lib/slug'
import { getGenreColorScheme } from '@/lib/genre-colors'

const props = defineProps<{
  genre: string
}>()

const scheme = computed(() => getGenreColorScheme(props.genre))
const slug = computed(() => genreNameToSlug(props.genre))
</script>

<template>
  <RouterLink
    :to="{
      name: 'genre-detail',
      params: { name: slug },
    }"
    class="group relative flex min-h-28 items-center overflow-hidden rounded-2xl border bg-linear-to-r to-transparent pl-8 pr-6 py-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    :class="[scheme.gradientFrom, scheme.hoverFrom, scheme.border, scheme.shadow]"
  >
    <!-- Left accent stripe -->
    <span
      class="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
      :class="scheme.stripe"
    />

    <!-- Oversized watermark text -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[5rem] font-black leading-none tracking-tighter transition-opacity duration-300 group-hover:opacity-[0.08] sm:text-[6rem]"
      :class="scheme.watermark"
    >
      {{ genre }}
    </span>

    <!-- Primary label -->
    <span class="relative z-10 text-xl font-bold" :class="scheme.text">
      {{ genre }}
    </span>

    <!-- Chevron indicator -->
    <ChevronRightIcon
      class="relative z-10 ml-auto size-6 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
  </RouterLink>
</template>
