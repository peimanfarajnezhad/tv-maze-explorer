<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { getShows } from '@/services/tvmaze'

const result = ref<string>('')
const loading = ref(false)

async function testService() {
  loading.value = true
  result.value = ''
  try {
    const shows = await getShows(0)
    result.value = `OK: got ${shows.length} shows. First: ${shows[0]?.name ?? '—'}`
  } catch (e) {
    result.value = `Error: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <Button variant="outline" :disabled="loading" @click="testService">
      {{ loading ? 'Loading…' : 'Test service' }}
    </Button>
    <p v-if="result" class="mt-2 text-sm">{{ result }}</p>
  </main>
</template>
