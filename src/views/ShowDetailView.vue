<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { StarIcon } from 'lucide-vue-next'

import { useShowDetail } from '@/composables/use-show-detail'
import PersonAvatar from '@/components/PersonAvatar.vue'
import EpisodeCard from '@/components/EpisodeCard.vue'
import ShowDetailSkeleton from '@/components/ShowDetailSkeleton.vue'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

const route = useRoute()
const showId = computed(() => route.params.id as string)

const {
  show,
  cast,
  crew,
  seasons,
  episodesBySeason,
  backgroundImage,
  posterImage,
  isLoading,
  error,
  notFound,
} = useShowDetail(showId)

const descriptionExpanded = ref(false)

const selectedSeasonNumber = ref<number>(1)
watch(
  seasons,
  (s) => {
    const first = s[0]?.number ?? 1
    if (!s.some((se) => se.number === selectedSeasonNumber.value)) {
      selectedSeasonNumber.value = first
    }
  },
  { immediate: true },
)
const selectedSeasonEpisodes = computed(
  () => episodesBySeason.value.get(selectedSeasonNumber.value) ?? [],
)

const carouselOpts = {
  align: 'start' as const,
  loop: false,
  dragFree: true,
}

function formatRating(avg: number | null | undefined): string {
  return avg != null ? avg.toFixed(1) : '—'
}

function yearFromPremiered(premiered: string | null): string {
  if (!premiered) return ''
  const y = premiered.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : ''
}

function stripHtml(html: string | null): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-8 py-6 px-4">
    <template v-if="isLoading">
      <ShowDetailSkeleton />
    </template>

    <Empty v-else-if="notFound">
      <EmptyHeader>
        <EmptyTitle>Show not found</EmptyTitle>
        <EmptyDescription
          >The show you're looking for doesn't exist or the link may be invalid.</EmptyDescription
        >
      </EmptyHeader>
    </Empty>

    <Empty v-else-if="error && !show">
      <EmptyHeader>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>{{ error }}</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <template v-else-if="show">
      <Alert v-if="error" variant="warning">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Hero: poster-card + backdrop -->
      <section class="relative w-full overflow-hidden rounded-lg bg-muted md:min-h-[50vh]">
        <!-- Backdrop: fixed height on mobile, full hero on desktop -->
        <div class="relative h-[200px] w-full md:absolute md:inset-0 md:h-full">
          <div
            v-if="backgroundImage"
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${backgroundImage})` }"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent md:from-background md:via-background/70 md:to-background/20"
          />
        </div>
        <!-- Content: poster + info; on very small screens only title/year/rate beside poster, rest below -->
        <div
          class="relative flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 md:min-h-[50vh] md:items-end md:p-6"
        >
          <!-- Poster card: overlaps backdrop on mobile -->
          <div class="-mt-16 shrink-0 md:mt-0">
            <img
              v-if="posterImage"
              :src="posterImage"
              :alt="show.name"
              class="w-[120px] aspect-2/3 rounded-lg object-cover shadow-lg md:w-[200px]"
            />
            <div
              v-else
              class="flex w-[120px] aspect-2/3 items-center justify-center rounded-lg bg-muted-foreground/20 text-2xl font-bold text-muted-foreground md:w-[200px]"
              aria-hidden="true"
            >
              {{ show.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <!-- Beside poster: on xs only title + year + rating; from sm up, full info -->
          <div class="flex min-w-0 flex-1 flex-col justify-end gap-3 pb-2 sm:gap-3 md:pb-0">
            <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
              {{ show.name }}
            </h1>
            <!-- Very small: only year + rating beside poster -->
            <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:hidden">
              <span v-if="yearFromPremiered(show.premiered)">
                {{ yearFromPremiered(show.premiered) }}
              </span>
              <span class="flex items-center gap-1">
                <StarIcon class="size-4 text-yellow-500 dark:text-yellow-400" />
                {{ formatRating(show.rating?.average) }}
              </span>
            </div>
            <!-- From sm: full metadata row -->
            <div class="hidden flex-wrap items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span v-if="yearFromPremiered(show.premiered)">
                {{ yearFromPremiered(show.premiered) }}
              </span>
              <span class="flex items-center gap-1">
                <StarIcon class="size-4 text-yellow-500 dark:text-yellow-400" />
                {{ formatRating(show.rating?.average) }}
              </span>
              <span v-if="show.genres?.length">
                {{ show.genres.join(', ') }}
              </span>
              <span v-if="show.runtime">{{ show.runtime }} min</span>
              <span v-if="show.network">{{ show.network.name }}</span>
              <span>{{ show.status }}</span>
            </div>
            <!-- From sm: description beside poster -->
            <template v-if="stripHtml(show.summary)">
              <p
                :class="[
                  'hidden max-w-2xl text-sm leading-relaxed sm:block md:line-clamp-none',
                  descriptionExpanded ? '' : 'line-clamp-3',
                ]"
              >
                {{ stripHtml(show.summary) }}
              </p>
              <button
                type="button"
                class="hidden self-start text-sm font-medium text-primary underline-offset-4 hover:underline sm:block md:sr-only"
                @click="descriptionExpanded = !descriptionExpanded"
              >
                {{ descriptionExpanded ? 'Show less' : 'Read more' }}
              </button>
            </template>
          </div>
          <!-- Very small only: genres, runtime, network, status + description full width below poster row -->
          <div class="flex flex-col gap-3 sm:hidden">
            <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span v-if="show.genres?.length">
                {{ show.genres.join(', ') }}
              </span>
              <span v-if="show.runtime">{{ show.runtime }} min</span>
              <span v-if="show.network">{{ show.network.name }}</span>
              <span>{{ show.status }}</span>
            </div>
            <template v-if="stripHtml(show.summary)">
              <p :class="['text-sm leading-relaxed', descriptionExpanded ? '' : 'line-clamp-3']">
                {{ stripHtml(show.summary) }}
              </p>
              <button
                type="button"
                class="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
                @click="descriptionExpanded = !descriptionExpanded"
              >
                {{ descriptionExpanded ? 'Show less' : 'Read more' }}
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- Cast -->
      <section v-if="cast.length" class="space-y-3">
        <h2 class="text-xl font-semibold">Cast</h2>
        <Carousel
          :opts="carouselOpts"
          v-slot="{ canScrollNext, canScrollPrev }"
          class="relative w-full"
        >
          <CarouselContent class="py-2">
            <CarouselItem
              v-for="item in cast"
              :key="item.person.id"
              class="basis-[100px] sm:basis-[120px]"
            >
              <PersonAvatar
                :image-url="item.person.image?.medium ?? item.person.image?.original ?? null"
                :name="item.person.name"
                :subtitle="item.character?.name"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious
            v-show="canScrollPrev"
            class="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
          <CarouselNext
            v-show="canScrollNext"
            class="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
        </Carousel>
      </section>

      <!-- Crew -->
      <section v-if="crew.length" class="space-y-3">
        <h2 class="text-xl font-semibold">Crew</h2>
        <Carousel
          :opts="carouselOpts"
          v-slot="{ canScrollNext, canScrollPrev }"
          class="relative w-full"
        >
          <CarouselContent class="py-2">
            <CarouselItem
              v-for="(item, idx) in crew"
              :key="`${item.person.id}-${item.type}-${idx}`"
              class="basis-[100px] sm:basis-[120px]"
            >
              <PersonAvatar
                :image-url="item.person.image?.medium ?? item.person.image?.original ?? null"
                :name="item.person.name"
                :subtitle="item.type"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious
            v-show="canScrollPrev"
            class="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
          <CarouselNext
            v-show="canScrollNext"
            class="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
        </Carousel>
      </section>

      <!-- Seasons & Episodes -->
      <section v-if="seasons.length" class="space-y-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-xl font-semibold">Seasons & Episodes</h2>
          <Select
            :model-value="String(selectedSeasonNumber)"
            @update:model-value="(v) => (selectedSeasonNumber = Number(v))"
          >
            <SelectTrigger class="w-full sm:w-[180px]" aria-label="Select season">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="season in seasons" :key="season.id" :value="String(season.number)">
                Season {{ season.number }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Carousel
          :opts="carouselOpts"
          v-slot="{ canScrollNext, canScrollPrev }"
          class="relative w-full"
        >
          <CarouselContent class="gap-1">
            <CarouselItem
              v-for="ep in selectedSeasonEpisodes"
              :key="ep.id"
              class="basis-[280px] sm:basis-[320px]"
            >
              <EpisodeCard :episode="ep" />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious
            v-show="canScrollPrev"
            class="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
          <CarouselNext
            v-show="canScrollNext"
            class="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background/90"
          />
        </Carousel>
      </section>
    </template>
  </main>
</template>
