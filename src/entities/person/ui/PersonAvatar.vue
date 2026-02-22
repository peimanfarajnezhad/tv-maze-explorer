<script setup lang="ts">
defineProps<{
  imageUrl?: string | null
  name: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex shrink-0 flex-col items-center gap-2 text-center">
    <div
      class="relative size-16 overflow-hidden rounded-full bg-muted ring-2 ring-border md:size-20"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="size-full object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="flex size-full items-center justify-center text-muted-foreground text-2xl font-medium"
      >
        {{ name.charAt(0).toUpperCase() }}
      </div>
    </div>
    <div class="min-w-0 max-w-[100px] sm:max-w-[120px]">
      <p class="truncate text-sm font-medium" :title="name">{{ name }}</p>
      <p v-if="subtitle" class="truncate text-xs text-muted-foreground" :title="subtitle">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
