<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Button } from '@/shared/ui/button'
import { SyncStatusBadge } from '@/features/show-sync'
import { ThemeToggle } from '@/features/theme'
import { Menu, X, Github } from 'lucide-vue-next'
import iconUrl from '@/assets/icon.png'

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
        class="flex shrink-0 items-center gap-2 font-semibold text-foreground no-underline hover:underline"
      >
        <img :src="iconUrl" alt="" class="size-7 rounded" aria-hidden="true" />
        <span class="hidden sm:inline">TV Maze Explorer</span>
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
          class="text-muted-foreground md:hidden"
          aria-label="Toggle menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Menu v-if="!mobileMenuOpen" class="size-5" />
          <X v-else class="size-5" />
        </Button>

        <a
          href="https://github.com/peimanfarajnezhad/tv-maze-explorer"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
          aria-label="GitHub"
        >
          <Github class="size-5" />
        </a>
        <ThemeToggle />
        <SyncStatusBadge>
          <slot name="sync-dialog-content" />
        </SyncStatusBadge>
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
          <a
            href="https://github.com/peimanfarajnezhad/tv-maze-explorer"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Github class="size-5" />
            GitHub
          </a>
        </nav>
      </div>
    </div>
  </header>
</template>
