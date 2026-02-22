<script setup lang="ts">
import { Skeleton } from '@/shared/ui/skeleton'
import { ShowCardSkeleton } from '@/entities/show'

const ROWS = 3
const CARDS_PER_ROW = 6
</script>

<template>
  <div class="space-y-8">
    <template v-for="row in ROWS" :key="row">
      <section class="space-y-3">
        <div
          class="flex items-center justify-between rounded-xl border border-border bg-muted/30 py-3 pl-5 pr-3"
        >
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
