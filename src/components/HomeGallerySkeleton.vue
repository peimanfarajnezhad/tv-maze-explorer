<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import ShowCardSkeleton from '@/components/ShowCardSkeleton.vue'

const ROWS = 3
const CARDS_PER_ROW = 6
</script>

<template>
  <div class="space-y-8">
    <template v-for="row in ROWS" :key="row">
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <Skeleton class="h-7 w-24" />
          <Skeleton class="h-9 w-24" />
        </div>
        <div class="flex gap-4 overflow-hidden">
          <ShowCardSkeleton v-for="c in CARDS_PER_ROW" :key="c" />
        </div>
      </section>
    </template>
  </div>
</template>
