<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Card
    class="w-[150px] py-0 shrink-0 overflow-hidden transition-shadow hover:shadow-md md:w-[160px] lg:w-[180px]"
  >
    <Skeleton class="aspect-2/3 w-full rounded-none" />
  </Card>
</template>
