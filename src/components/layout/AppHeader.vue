<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import SearchModal from './SearchModal.vue'
import SyncStatusBadge from './SyncStatusBadge.vue'
import { Menu, X, Github } from 'lucide-vue-next'

const route = useRoute()
const mobileMenuOpen = ref(false)

interface NavItem {
  label: string
  to: { name: string }
}
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: { name: 'home' } },
  { label: 'Search', to: { name: 'search' } },
  { label: 'Genres', to: { name: 'genres' } },
]

function isActive(item: NavItem): boolean {
  if (route.name === item.to.name) return true
  if (item.to.name === 'genres' && route.name === 'genre-detail') return true
  return false
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
  >
    <div class="container mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
      <RouterLink
        :to="{ name: 'home' }"
        class="shrink-0 font-semibold text-foreground no-underline hover:underline"
      >
        TV Maze Explorer
      </RouterLink>

      <nav class="hidden items-center gap-6 md:flex" aria-label="Main">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.label"
          :to="item.to"
          class="text-sm transition-colors hover:text-foreground"
          :class="isActive(item) ? 'text-foreground font-medium' : 'text-muted-foreground'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex flex-1 items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          class="md:hidden"
          aria-label="Toggle menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Menu v-if="!mobileMenuOpen" class="size-5" />
          <X v-else class="size-5" />
        </Button>

        <SearchModal />
        <a
          href="#"
          class="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
          aria-label="GitHub"
        >
          <Github class="size-5" />
        </a>
        <SyncStatusBadge />
      </div>
    </div>

    <div
      :class="[
        'border-t border-border bg-background md:hidden',
        mobileMenuOpen ? 'block' : 'hidden',
      ]"
    >
      <div class="container mx-auto flex flex-col gap-4 px-4 py-4">
        <nav class="flex flex-col gap-2" aria-label="Main mobile">
          <RouterLink
            v-for="item in NAV_ITEMS"
            :key="item.label"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            :class="
              isActive(item)
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <a
          href="#"
          class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Github class="size-5" />
          GitHub
        </a>
      </div>
    </div>
  </header>
</template>
