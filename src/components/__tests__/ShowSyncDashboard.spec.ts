import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within, fireEvent, renderWithProviders, waitFor } from '@/test-utils'

import { useShowSyncStore } from '@/stores/show-sync'

import ShowSyncDashboard from '../ShowSyncDashboard.vue'

describe('ShowSyncDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders heading "Show Database Sync"', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    expect(screen.getByRole('heading', { name: 'Show Database Sync', level: 2 })).toBeInTheDocument()
  })

  it('when status is idle, does not show progress bar or status details', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/Probing/)).not.toBeInTheDocument()
  })

  it('when status is probing, shows progress and "Estimating total pages"', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    store.$patch({
      status: 'probing',
      lastCompletedPage: -1,
      estimatedTotalPages: 10,
      totalShowsStored: 0,
    })
    await nextTick()

    await waitFor(() => {
      expect(screen.getByText(/Estimating total pages/)).toBeInTheDocument()
      expect(screen.getByText(/Probing/)).toBeInTheDocument()
    })
  })

  it('when status is syncing, shows Pause button', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    store.$patch({
      status: 'syncing',
      lastCompletedPage: 2,
      estimatedTotalPages: 10,
      totalShowsStored: 30,
    })
    await nextTick()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause sync/i })).toBeInTheDocument()
    })
  })

  it('when status is paused, shows Resume button', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    store.$patch({
      status: 'paused',
      lastCompletedPage: 5,
      estimatedTotalPages: 10,
      totalShowsStored: 150,
    })
    await nextTick()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume sync/i })).toBeInTheDocument()
    })
  })

  it('calls store.pause when Pause is clicked', async () => {
    const { container } = await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    const pauseSpy = vi.spyOn(store, 'pause')
    store.$patch({
      status: 'syncing',
      lastCompletedPage: 2,
      estimatedTotalPages: 10,
      totalShowsStored: 30,
    })
    await nextTick()

    await waitFor(
      () => {
        const pauseButton = within(container as HTMLElement).getByRole('button', {
          name: /pause sync/i,
        })
        expect(pauseButton).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
    const pauseButton = within(container as HTMLElement).getByRole('button', {
      name: /pause sync/i,
    })
    await fireEvent.click(pauseButton)
    expect(pauseSpy).toHaveBeenCalledTimes(1)
  })

  it('when status is completed, shows Complete and show count', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    store.$patch({
      status: 'completed',
      totalShowsStored: 250,
      lastCompletedPage: 9,
      estimatedTotalPages: 10,
    })
    await nextTick()

    await waitFor(() => {
      expect(screen.getByText(/Complete/)).toBeInTheDocument()
      expect(screen.getByText(/250 shows in IndexedDB/)).toBeInTheDocument()
    })
  })

  it('when status is error, shows error message and Retry button', async () => {
    await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    store.$patch({
      status: 'error',
      errorMessage: 'Network failed',
    })
    await nextTick()

    await waitFor(() => {
      expect(screen.getByText('Network failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('calls store.retry when Retry is clicked', async () => {
    const { container } = await renderWithProviders(ShowSyncDashboard, {})
    const store = useShowSyncStore()
    const retrySpy = vi.spyOn(store, 'retry')
    store.$patch({ status: 'error', errorMessage: 'Failed' })
    await nextTick()

    await waitFor(
      () => {
        const retryButton = within(container as HTMLElement).getByRole('button', {
          name: /retry/i,
        })
        expect(retryButton).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
    const retryButton = within(container as HTMLElement).getByRole('button', {
      name: /retry/i,
    })
    await fireEvent.click(retryButton)
    expect(retrySpy).toHaveBeenCalledTimes(1)
  })
})
