<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShowSyncStore } from '@/stores/show-sync'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search } from 'lucide-vue-next'
import DialogDescription from '../ui/dialog/DialogDescription.vue'
import DialogHeader from '../ui/dialog/DialogHeader.vue'

const router = useRouter()
const store = useShowSyncStore()
const open = ref(false)
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    setTimeout(() => {
      const el = inputEl.value
      if (el && typeof el.focus === 'function') el.focus()
    }, 0)
  }
})

function submit() {
  const q = query.value.trim()
  open.value = false
  router.push({ name: 'search', query: q ? { q } : {} })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="ghost" size="icon" class="shrink-0" aria-label="Search shows">
        <Search class="size-5 text-muted-foreground" />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md" :show-close-button="true">
      <DialogHeader>
        <DialogTitle>Search shows</DialogTitle>
        <DialogDescription>
          {{ store.totalShowsStored.toLocaleString() }} shows in database
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="store.status !== 'completed'" variant="warning">
        <AlertDescription>
          Sync in progress or incomplete. Search results may be limited or outdated.
        </AlertDescription>
      </Alert>

      <div class="space-y-4 pt-2">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref="inputEl"
            v-model="query"
            type="search"
            placeholder="Search shows..."
            class="w-full pl-9 text-base"
            aria-describedby="search-modal-hint"
            @keydown="onKeydown"
          />
        </div>
        <p id="search-modal-hint" class="text-xs text-muted-foreground" role="status">
          Press Enter to search
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
