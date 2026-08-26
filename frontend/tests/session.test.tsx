import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SessionControl } from '@/features/auth/SessionControl'
import { renderWithProviders } from './test-utils'

describe('Session', () => {
  async function submitLogin(
    user: ReturnType<typeof renderWithProviders>['user'],
    password: string,
  ) {
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await user.type(screen.getByLabelText('Email'), 'admin@librarycatalog.dev')
    await user.type(screen.getByLabelText('Password'), password)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign in' }))
  }

  it('signs in and shows who is signed in', async () => {
    const { user } = renderWithProviders(<SessionControl />)

    await submitLogin(user, 'Admin@123')

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.getByText('admin@librarycatalog.dev')).toBeInTheDocument()
    expect(screen.getByText('staff')).toBeInTheDocument()
  })

  it('shows the server wording on a wrong password and stays open', async () => {
    const { user } = renderWithProviders(<SessionControl />)

    await submitLogin(user, 'wrong-password')

    // The server deliberately does not distinguish an unknown email from a wrong
    // password, and the dialog should not invent a more specific message.
    expect(await screen.findByText('Email or password is incorrect.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('signs out again', async () => {
    const { user } = renderWithProviders(<SessionControl />)
    await submitLogin(user, 'Admin@123')
    await screen.findByRole('button', { name: 'Sign out' })

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('restores a session that survived a reload', async () => {
    const { user, unmount } = renderWithProviders(<SessionControl />)
    await submitLogin(user, 'Admin@123')
    await screen.findByRole('button', { name: 'Sign out' })

    // Remounting stands in for a page reload: the provider reads sessionStorage on
    // first render, which is the whole reason the token is not kept in memory only.
    unmount()
    renderWithProviders(<SessionControl />)

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('ignores a stored session whose token has expired', async () => {
    sessionStorage.setItem(
      'library-catalog.session',
      JSON.stringify({
        token: 'expired',
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
        email: 'admin@librarycatalog.dev',
        role: 'staff',
      }),
    )

    renderWithProviders(<SessionControl />)

    // Working in a signed-in-looking UI whose every write returns 401 is worse
    // than being told to sign in again.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument(),
    )
  })

  it('survives unreadable stored session data', async () => {
    sessionStorage.setItem('library-catalog.session', 'not json')

    renderWithProviders(<SessionControl />)

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
