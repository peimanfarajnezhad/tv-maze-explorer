<script setup lang="ts">
import GenreCard from '@/components/GenreCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllGenres } from '@/composables/use-all-genres'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

const { genres, isLoading } = useAllGenres()
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-6 py-8 px-4">
    <h1 class="text-2xl font-semibold">Genres</h1>

    <template v-if="isLoading && genres.length === 0">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="i in 12" :key="i" class="h-28 rounded-2xl" />
      </div>
    </template>

    <Empty v-else-if="!isLoading && genres.length === 0">
      <EmptyHeader>
        <EmptyTitle>No genres yet</EmptyTitle>
        <EmptyDescription>Sync in progress or no data in database.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GenreCard v-for="genre in genres" :key="genre" :genre="genre" />
    </div>
  </main>
</template>
