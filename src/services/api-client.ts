import { CONFIG } from '@/config'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`API error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

export class ApiRateLimitError extends ApiError {
  constructor(statusText: string) {
    super(429, statusText)
    this.name = 'ApiRateLimitError'
  }
}

export async function get<T>(path: string): Promise<T> {
  const base = CONFIG.API_HOST.replace(/\/+$/, '')
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiRateLimitError(response.statusText)
    }
    throw new ApiError(response.status, response.statusText)
  }

  return response.json() as Promise<T>
}
