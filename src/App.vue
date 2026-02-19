<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useShowSyncStore } from '@/stores/show-sync'
import AppLayout from '@/components/layout/AppLayout.vue'

const showSyncStore = useShowSyncStore()

onMounted(() => {
  showSyncStore.initialize()
})
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
</template>
