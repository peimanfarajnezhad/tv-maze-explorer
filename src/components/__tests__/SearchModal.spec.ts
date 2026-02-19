import { describe, it, expect } from 'vitest'
import { screen, within, fireEvent, renderWithProviders, waitFor } from '@/test-utils'

import SearchModal from '../layout/SearchModal.vue'

describe('SearchModal', () => {
  it('renders search trigger button', async () => {
    await renderWithProviders(SearchModal, {
      useRouter: true,
      initialRoute: '/',
    })
    const triggers = screen.getAllByRole('button', { name: 'Search shows' })
    expect(triggers.length).toBeGreaterThanOrEqual(1)
  })

  it('opens dialog with title, input, and hint when trigger is clicked', async () => {
    await renderWithProviders(SearchModal, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 42 } },
    })
    const triggers = screen.getAllByRole('button', { name: 'Search shows' })
    await fireEvent.click(triggers[0]!)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Search shows' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search shows...')).toBeInTheDocument()
      expect(screen.getByText('Press Enter to search')).toBeInTheDocument()
    })
  })

  it('shows total shows count in dialog description', async () => {
    await renderWithProviders(SearchModal, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 1234 } },
    })
    await fireEvent.click(screen.getAllByRole('button', { name: 'Search shows' })[0]!)

    await waitFor(() => {
      expect(screen.getByText('1,234 shows in database')).toBeInTheDocument()
    })
  })

  it('shows sync warning when status is not completed', async () => {
    await renderWithProviders(SearchModal, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: { showSync: { status: 'syncing', totalShowsStored: 10 } },
    })
    await fireEvent.click(screen.getAllByRole('button', { name: 'Search shows' })[0]!)

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThanOrEqual(1)
      const syncWarnings = screen.getAllByText(/Sync in progress or incomplete/)
      expect(syncWarnings.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('does not show sync warning when status is completed', async () => {
    await renderWithProviders(SearchModal, {
      useRouter: true,
      initialRoute: '/',
      initialStoreState: { showSync: { status: 'completed', totalShowsStored: 10 } },
    })
    await fireEvent.click(screen.getAllByRole('button', { name: 'Search shows' })[0]!)

    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: 'Search shows' })
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
