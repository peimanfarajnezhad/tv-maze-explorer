<script setup lang="ts">
import { Skeleton } from '@/shared/ui/skeleton'
</script>

<template>
  <div class="space-y-8">
    <div class="relative w-full overflow-hidden rounded-lg bg-muted md:min-h-[50vh]">
      <!-- Backdrop bar -->
      <div class="relative h-[200px] w-full md:absolute md:inset-0 md:h-full">
        <Skeleton class="size-full rounded-lg" />
      </div>
      <!-- Poster + text row -->
      <div class="relative flex gap-4 p-4 md:min-h-[50vh] md:items-end md:gap-6 md:p-6">
        <Skeleton class="-mt-16 w-[120px] shrink-0 rounded-lg aspect-2/3 md:mt-0 md:w-[200px]" />
        <div class="flex min-w-0 flex-1 flex-col justify-end gap-3 pb-2 md:pb-0">
          <Skeleton class="h-8 w-3/4 max-w-md" />
          <div class="flex gap-2">
            <Skeleton class="h-5 w-16 rounded" />
            <Skeleton class="h-5 w-24 rounded" />
          </div>
          <Skeleton class="h-4 w-full max-w-2xl" />
          <Skeleton class="h-4 w-2/3 max-w-xl" />
        </div>
      </div>
    </div>

    <section class="space-y-3">
      <Skeleton class="h-6 w-24" />
      <div class="flex gap-4 overflow-hidden">
        <div v-for="i in 6" :key="i" class="flex shrink-0 flex-col items-center gap-2">
          <Skeleton class="size-16 rounded-full md:size-20" />
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-3 w-12" />
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <Skeleton class="h-6 w-20" />
      <div class="flex gap-4 overflow-hidden">
        <div v-for="i in 5" :key="i" class="flex shrink-0 flex-col items-center gap-2">
          <Skeleton class="size-16 rounded-full md:size-20" />
          <Skeleton class="h-4 w-20" />
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <Skeleton class="h-8 w-32 rounded-lg" />
      <div class="flex gap-4 overflow-hidden">
        <Skeleton
          v-for="i in 4"
          :key="i"
          class="h-[180px] w-[280px] shrink-0 rounded-lg sm:w-[320px]"
        />
      </div>
    </section>
  </div>
</template>
