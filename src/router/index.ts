import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
  },
  {
    path: '/genres',
    name: 'genres',
    component: () => import('@/views/GenresView.vue'),
  },
  {
    path: '/genres/:name',
    name: 'genre-detail',
    component: () => import('@/views/GenreView.vue'),
  },
  {
    path: '/shows/:id(\\d+)',
    name: 'show-detail',
    component: () => import('@/views/ShowDetailView.vue'),
  },
] as const

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...routes],
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

export default router
