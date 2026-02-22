export const CONFIG = {
  API_HOST: import.meta.env.VITE_API_HOST ?? 'https://api.tvmaze.com',
  INITIAL_MAX_WAIT_MS: 2000,
} as const
