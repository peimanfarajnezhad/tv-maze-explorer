<script setup lang="ts">
import { computed } from 'vue'
import { useGenreCarousels, GenreCarousel, HomeGallerySkeleton } from '@/widgets/genre-carousels'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/ui/empty'

const { carousels, isLoading } = useGenreCarousels()

const showSkeleton = computed(() => isLoading.value && carousels.value.length === 0)
const showContent = computed(() => carousels.value.length > 0 || !isLoading.value)
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-8 py-8 px-4">
    <template v-if="showSkeleton">
      <HomeGallerySkeleton />
    </template>

    <template v-else-if="showContent">
      <template v-if="carousels.length > 0">
        <GenreCarousel
          v-for="item in carousels"
          :key="item.genre"
          :genre="item.genre"
          :shows="item.shows"
        />
      </template>
      <Empty v-else>
        <EmptyHeader>
          <EmptyTitle>No shows yet</EmptyTitle>
          <EmptyDescription>Sync in progress or no data in database.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </template>
  </main>
</template>
