<script setup lang="ts">
import { computed } from 'vue'
import { Database } from 'lucide-vue-next'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Button } from '@/shared/ui/button'
import { useShowSyncStore } from '@/features/show-sync'

const store = useShowSyncStore()

const tooltipLabel = computed(() => {
  switch (store.status) {
    case 'probing':
      return 'Estimating sync...'
    case 'syncing':
      return `Syncing... ${store.progressPercent ?? 0}%`
    case 'paused':
      return 'Sync paused'
    case 'completed':
      return `${store.totalShowsStored.toLocaleString()} shows synced`
    case 'error':
      return 'Sync error'
    default:
      return 'Show sync status'
  }
})

const badgeDotClass = computed(() => {
  switch (store.status) {
    case 'probing':
    case 'syncing':
      return 'bg-blue-500 dark:bg-blue-400 animate-pulse'
    case 'paused':
      return 'bg-yellow-500 dark:bg-yellow-400'
    case 'completed':
      return 'bg-green-500 dark:bg-green-400'
    case 'error':
      return 'bg-red-500 dark:bg-red-400'
    default:
      return 'bg-muted-foreground'
  }
})
</script>

<template>
  <TooltipProvider>
    <Dialog>
      <Tooltip>
        <TooltipTrigger as-child>
          <DialogTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="relative shrink-0"
              aria-label="Show sync status"
            >
              <span class="relative inline-flex">
                <Database class="size-5 text-muted-foreground" />
                <span
                  aria-hidden
                  :class="['absolute -right-0.5 -top-0.5 size-2 rounded-full', badgeDotClass]"
                />
              </span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{{ tooltipLabel }}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent class="sm:max-w-lg">
        <DialogTitle class="sr-only">Show Database Sync</DialogTitle>
        <slot />
      </DialogContent>
    </Dialog>
  </TooltipProvider>
</template>
