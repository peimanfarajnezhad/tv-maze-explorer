import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/home/ui/HomePage.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/pages/search/ui/SearchPage.vue'),
  },
  {
    path: '/genres',
    name: 'genres',
    component: () => import('@/pages/genres/ui/GenresPage.vue'),
  },
  {
    path: '/genres/:name',
    name: 'genre-detail',
    component: () => import('@/pages/genre/ui/GenrePage.vue'),
  },
  {
    path: '/shows/:id(\\d+)',
    name: 'show-detail',
    component: () => import('@/pages/show-detail/ui/ShowDetailPage.vue'),
  },
] as const

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...routes],
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

export default router
