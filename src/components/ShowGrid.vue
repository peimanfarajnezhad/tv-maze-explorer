<script setup lang="ts">
import { computed } from 'vue'

import { PAGE_SIZE } from '@/composables/use-shows-by-genre'
import type { TvmazeShow } from '@/types'
import ShowCard from '@/components/ShowCard.vue'
import ShowCardSkeleton from '@/components/ShowCardSkeleton.vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

const props = withDefaults(
  defineProps<{
    shows: TvmazeShow[]
    notFound: boolean
    loading: boolean
    skeletonCount?: number
    page: number
    totalCount: number
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    skeletonCount: PAGE_SIZE,
    emptyTitle: 'No results',
    emptyDescription: 'Try adjusting your filters.',
  },
)

const emit = defineEmits<{
  'update:page': [newPage: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalCount / PAGE_SIZE)))

function onPageChange(newPage: number) {
  emit('update:page', newPage)
}
</script>

<template>
  <Empty v-if="notFound">
    <EmptyHeader>
      <EmptyTitle>Genre not found</EmptyTitle>
      <EmptyDescription
        >The genre you're looking for doesn't exist or has no shows.</EmptyDescription
      >
    </EmptyHeader>
  </Empty>

  <template v-else-if="loading">
    <div class="flex flex-wrap justify-center gap-4">
      <ShowCardSkeleton v-for="i in skeletonCount" :key="i" />
    </div>
  </template>

  <template v-else>
    <div class="flex flex-wrap justify-center gap-4">
      <ShowCard v-for="show in shows" :key="show.id" :show="show" />
    </div>

    <div v-if="totalPages > 1" class="flex justify-center pt-4">
      <Pagination
        :page="page"
        :total="totalCount"
        :items-per-page="PAGE_SIZE"
        :sibling-count="1"
        @update:page="onPageChange"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationFirst />
          <PaginationPrevious />
          <template v-for="(item, idx) in items" :key="idx">
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === page"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else />
          </template>
          <PaginationNext />
          <PaginationLast />
        </PaginationContent>
      </Pagination>
    </div>

    <Empty v-else-if="shows.length === 0">
      <EmptyHeader>
        <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
        <EmptyDescription>{{ emptyDescription }}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </template>
</template>
