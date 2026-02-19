<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAllGenres } from '@/composables/use-all-genres'
import { genreNameToSlug } from '@/lib/slug'
import { Skeleton } from '@/components/ui/skeleton'

const { genres, isLoading } = useAllGenres()

const GENRE_CARD_COLORS = [
  'bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-500/30',
  'bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 border-indigo-500/30',
  'bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-100 border-fuchsia-500/30',
  'bg-blue-500/20 text-blue-900 dark:text-blue-100 border-blue-500/30',
  'bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 border-emerald-500/30',
  'bg-rose-500/20 text-rose-900 dark:text-rose-100 border-rose-500/30',
  'bg-orange-500/20 text-orange-900 dark:text-orange-100 border-orange-500/30',
  'bg-slate-500/20 text-slate-900 dark:text-slate-100 border-slate-500/30',
  'bg-cyan-500/20 text-cyan-900 dark:text-cyan-100 border-cyan-500/30',
  'bg-violet-500/20 text-violet-900 dark:text-violet-100 border-violet-500/30',
  'bg-zinc-500/20 text-zinc-900 dark:text-zinc-100 border-zinc-500/30',
  'bg-teal-500/20 text-teal-900 dark:text-teal-100 border-teal-500/30',
  'bg-pink-500/20 text-pink-900 dark:text-pink-100 border-pink-500/30',
  'bg-lime-500/20 text-lime-900 dark:text-lime-100 border-lime-500/30',
  'bg-sky-500/20 text-sky-900 dark:text-sky-100 border-sky-500/30',
  'bg-green-500/20 text-green-900 dark:text-green-100 border-green-500/30',
  'bg-stone-500/20 text-stone-900 dark:text-stone-100 border-stone-500/30',
  'bg-red-500/20 text-red-900 dark:text-red-100 border-red-500/30',
  'bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 border-yellow-500/30',
  'bg-purple-500/20 text-purple-900 dark:text-purple-100 border-purple-500/30',
  'bg-gray-500/20 text-gray-900 dark:text-gray-100 border-gray-500/30',
] as const

function colorClassForIndex(index: number): string {
  return GENRE_CARD_COLORS[index % GENRE_CARD_COLORS.length] ?? GENRE_CARD_COLORS[0]
}
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-6 py-8 px-4">
    <h1 class="text-2xl font-semibold">Genres</h1>

    <template v-if="isLoading && genres.length === 0">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <Skeleton v-for="i in 12" :key="i" class="h-24 rounded-xl" />
      </div>
    </template>

    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <RouterLink
        v-for="(genre, index) in genres"
        :key="genre"
        :to="{
          name: 'genre-detail',
          params: { name: genreNameToSlug(genre) },
        }"
        class="flex min-h-24 items-center justify-center rounded-xl border px-4 py-5 text-center font-medium transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        :class="colorClassForIndex(index)"
      >
        {{ genre }}
      </RouterLink>
    </div>

    <p v-if="!isLoading && genres.length === 0" class="text-muted-foreground">
      No genres yet. Sync in progress or no data in database.
    </p>
  </main>
</template>
