<script setup lang="ts">
import { computed } from 'vue'
import { useShowSyncStore } from '@/stores/show-sync'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, Loader2, Pause, Play } from 'lucide-vue-next'

const store = useShowSyncStore()

const isActive = computed(() => store.status === 'probing' || store.status === 'syncing')
const canPause = computed(() => store.status === 'syncing')
const canResume = computed(() => store.status === 'paused')
const showRetry = computed(() => store.status === 'error')
const showComplete = computed(() => store.status === 'completed')

const formatPages = computed(() => {
  const last = store.lastCompletedPage
  const total = store.estimatedTotalPages
  if (total != null) return `${last + 1} / ~${total}`
  return last >= 0 ? `${last + 1}` : '—'
})
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Show Database Sync</h2>

    <div class="space-y-4">
      <!-- Progress bar with Pause/Resume at the start -->
      <div v-if="store.status !== 'idle' && store.status !== 'error'" class="space-y-2">
        <div class="flex items-center justify-center gap-2">
          <div v-if="isActive || canResume" class="shrink-0">
            <Button
              v-if="canPause"
              variant="outline"
              size="icon"
              aria-label="Pause sync"
              @click="store.pause()"
            >
              <Pause class="size-4" />
            </Button>
            <Button
              v-else-if="canResume"
              variant="outline"
              size="icon"
              aria-label="Resume sync"
              @click="store.resume()"
            >
              <Play class="size-4" />
            </Button>
          </div>
          <div class="flex-1">
            <Progress :model-value="store.progressPercent ?? 0" class="h-2" />
          </div>
          <div v-if="store.progressPercent != null" class="shrink-0">
            <span class="text-start text-sm text-muted-foreground">
              {{ store.progressPercent }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Probing -->
      <div
        v-if="store.status === 'probing'"
        class="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 class="size-4 animate-spin" />
        <span>Estimating total pages...</span>
      </div>

      <!-- Stats -->
      <dl v-if="store.status !== 'idle'" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-muted-foreground">Status</dt>
        <dd>
          <span v-if="store.status === 'probing'" class="flex items-center gap-1">
            <Loader2 class="size-4 animate-spin" />
            Probing...
          </span>
          <span v-else-if="store.status === 'syncing'">Syncing...</span>
          <span v-else-if="store.status === 'paused'" class="text-muted-foreground">Paused</span>
          <span
            v-else-if="store.status === 'completed'"
            class="flex items-center gap-1 text-green-600 dark:text-green-400"
          >
            <Check class="size-4" />
            Complete
          </span>
          <span
            v-else-if="store.status === 'error'"
            class="flex items-center gap-1 text-destructive"
          >
            <AlertCircle class="size-4" />
            Error
          </span>
        </dd>

        <dt class="text-muted-foreground">Pages</dt>
        <dd>{{ formatPages }}</dd>

        <dt class="text-muted-foreground">Shows stored</dt>
        <dd>{{ store.totalShowsStored.toLocaleString() }}</dd>

        <template v-if="isActive">
          <dt class="text-muted-foreground">Speed</dt>
          <dd>{{ store.pagesPerSecond.toFixed(1) }} pages/sec</dd>

          <dt class="text-muted-foreground">ETA</dt>
          <dd>{{ store.formattedETA }}</dd>
        </template>
      </dl>

      <!-- Error + Retry -->
      <div v-if="showRetry" class="space-y-2">
        <p class="text-sm text-destructive">{{ store.errorMessage }}</p>
        <Button variant="outline" size="sm" @click="store.retry()"> Retry </Button>
      </div>

      <!-- Complete message -->
      <p v-if="showComplete" class="text-sm text-muted-foreground">
        Sync complete. {{ store.totalShowsStored.toLocaleString() }} shows in IndexedDB.
      </p>
    </div>
  </div>
</template>
