/**
 * Sliding-window rate limiter for API calls.
 * Ensures at most maxRequests within windowMs; acquire() resolves when a slot is available.
 */

export class RateLimiter {
  readonly #maxRequests: number
  readonly #windowMs: number
  #timestamps: number[] = []
  #waitQueue: Array<() => void> = []
  #disposed = false

  constructor(maxRequests: number, windowMs: number) {
    this.#maxRequests = maxRequests
    this.#windowMs = windowMs
  }

  #prune(): void {
    const cutoff = Date.now() - this.#windowMs
    this.#timestamps = this.#timestamps.filter((t) => t > cutoff)
  }

  #processQueue(): void {
    this.#prune()
    while (this.#waitQueue.length > 0 && this.#timestamps.length < this.#maxRequests) {
      const next = this.#waitQueue.shift()
      if (next) next()
    }
  }

  /**
   * Resolves when a request slot is available. Call this before each API request.
   */
  acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.#disposed) {
        reject(new Error('RateLimiter disposed'))
        return
      }
      const run = (): void => {
        if (this.#disposed) {
          reject(new Error('RateLimiter disposed'))
          return
        }
        this.#prune()
        if (this.#timestamps.length < this.#maxRequests) {
          this.#timestamps.push(Date.now())
          resolve()
          this.#processQueue()
        } else {
          const oldest = this.#timestamps[0]!
          const waitMs = Math.max(0, this.#windowMs - (Date.now() - oldest))
          this.#waitQueue.push(() => {
            if (this.#disposed) reject(new Error('RateLimiter disposed'))
            else run()
          })
          setTimeout(() => this.#processQueue(), waitMs)
        }
      }
      run()
    })
  }

  /**
   * Reject any pending waiters. Call when tearing down the sync engine.
   */
  dispose(): void {
    this.#disposed = true
    for (const cb of this.#waitQueue) {
      cb()
    }
    this.#waitQueue = []
  }
}
