import { describe, it, expect } from 'vitest'
import { nextTick, h } from 'vue'
import { screen, fireEvent, renderWithProviders, waitFor } from '@/test-utils'
import { useShowSyncStore } from '@/features/show-sync'
import { ShowSyncDashboard } from '@/widgets/show-sync-dashboard'

import SyncStatusBadge from '../SyncStatusBadge.vue'

describe('SyncStatusBadge', () => {
  it('renders sync status trigger button', async () => {
    await renderWithProviders(SyncStatusBadge, {
      slots: { default: () => h(ShowSyncDashboard) },
    })
    const buttons = screen.getAllByRole('button', { name: 'Show sync status' })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('opens dialog with ShowSyncDashboard when trigger is clicked', async () => {
    await renderWithProviders(SyncStatusBadge, {
      slots: { default: () => h(ShowSyncDashboard) },
    })
    await fireEvent.click(screen.getAllByRole('button', { name: 'Show sync status' })[0]!)

    await waitFor(() => {
      const dialogs = screen.getAllByRole('dialog', { name: 'Show Database Sync' })
      expect(dialogs.length).toBeGreaterThanOrEqual(1)
      const headings = screen.getAllByRole('heading', { name: 'Show Database Sync', level: 2 })
      expect(headings.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('when status is completed, dashboard shows sync complete and count', async () => {
    await renderWithProviders(SyncStatusBadge, {
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 500 } },
      slots: { default: () => h(ShowSyncDashboard) },
    })
    await fireEvent.click(screen.getAllByRole('button', { name: 'Show sync status' })[0]!)
    await nextTick()

    await waitFor(
      () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        const completeTexts = screen.getAllByText(/Sync complete/)
        expect(completeTexts.length).toBeGreaterThanOrEqual(1)
        const countTexts = screen.getAllByText(/500/)
        expect(countTexts.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it('when status is syncing, shows syncing progress in dashboard', async () => {
    await renderWithProviders(SyncStatusBadge, {
      slots: { default: () => h(ShowSyncDashboard) },
    })
    const store = useShowSyncStore()
    store.$patch({
      status: 'syncing',
      totalShowsStored: 100,
      lastCompletedPage: 2,
      estimatedTotalPages: 10,
    })
    await nextTick()
    await fireEvent.click(screen.getAllByRole('button', { name: 'Show sync status' })[0]!)

    await waitFor(
      () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Syncing/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('when status is error, shows error message and Retry in dashboard', async () => {
    await renderWithProviders(SyncStatusBadge, {
      slots: { default: () => h(ShowSyncDashboard) },
    })
    const store = useShowSyncStore()
    store.$patch({ status: 'error', errorMessage: 'Network failed' })
    await nextTick()

    await fireEvent.click(screen.getAllByRole('button', { name: 'Show sync status' })[0]!)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Network failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })
  })
})
