import { screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { SessionControl } from '@/features/auth/SessionControl'
import { GenresListPage } from '@/features/genres/GenresListPage'
import { catalog } from './msw/catalog'
import { problem } from './msw/handlers'
import { server } from './msw/server'
import { renderWithProviders } from './test-utils'

const BASE = 'http://localhost:8080'

/** Signs in through the real login flow so the token reaches the HTTP client. */
async function signIn(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Sign in' }))
  await user.type(screen.getByLabelText('Email'), 'admin@librarycatalog.dev')
  await user.type(screen.getByLabelText('Password'), 'Admin@123')
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('Genres', () => {
  it('lists what the API returns', async () => {
    renderWithProviders(<GenresListPage />)

    expect(await screen.findByText('Fantasy')).toBeInTheDocument()
    expect(screen.getByText('Science Fiction')).toBeInTheDocument()
  })

  it('offers no write controls while signed out', async () => {
    renderWithProviders(<GenresListPage />)
    await screen.findByText('Fantasy')

    // Not a security boundary — the API enforces the role — but offering buttons
    // that can only answer 401 is its own defect.
    expect(screen.queryByRole('button', { name: 'New genre' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('creates a genre and shows it without a manual refresh', async () => {
    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    await user.click(screen.getByRole('button', { name: 'New genre' }))
    await user.type(screen.getByLabelText('Name'), 'Horror')
    await user.click(screen.getByRole('button', { name: 'Save genre' }))

    // Proves the mutation invalidated the list and the refetch landed.
    expect(await screen.findByText('Horror')).toBeInTheDocument()
  })

  it('keeps the dialog open and explains a duplicate name', async () => {
    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    await user.click(screen.getByRole('button', { name: 'New genre' }))
    // Differs only by case: the server matches case-insensitively.
    await user.type(screen.getByLabelText('Name'), 'fantasy')
    await user.click(screen.getByRole('button', { name: 'Save genre' }))

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('attaches a server field error to the matching form field', async () => {
    // The API reports property names in PascalCase; the form fields are camelCase.
    // Without the mapping the message silently never reaches the field.
    server.use(
      http.post(`${BASE}/api/v1/genres`, () =>
        problem(400, 'validation-failed', 'The request did not pass validation.', {
          Name: ['Name must be between 2 and 100 characters.'],
        }),
      ),
    )

    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    await user.click(screen.getByRole('button', { name: 'New genre' }))
    await user.type(screen.getByLabelText('Name'), 'Horror')
    await user.click(screen.getByRole('button', { name: 'Save genre' }))

    const nameInput = await screen.findByLabelText('Name')
    await waitFor(() => expect(nameInput).toHaveAttribute('aria-invalid', 'true'))

    // Associated as a description rather than folded into the accessible name.
    const describedBy = nameInput.getAttribute('aria-describedby') as string
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'Name must be between 2 and 100 characters.',
    )
  })

  it('still shows a message when the error names a field the form does not render', async () => {
    // Reporting such an error as handled would leave a form that refuses to submit
    // with nothing shown anywhere.
    server.use(
      http.post(`${BASE}/api/v1/genres`, () =>
        problem(400, 'validation-failed', 'Something else was wrong.', {
          SomeFieldTheFormDoesNotHave: ['Nope.'],
        }),
      ),
    )

    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    await user.click(screen.getByRole('button', { name: 'New genre' }))
    await user.type(screen.getByLabelText('Name'), 'Horror')
    await user.click(screen.getByRole('button', { name: 'Save genre' }))

    expect(await screen.findByText('Something else was wrong.')).toBeInTheDocument()
  })

  it('explains a delete refused because books still reference the genre', async () => {
    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    const fantasyRow = (await screen.findByText('Fantasy')).closest('tr') as HTMLElement
    await user.click(within(fantasyRow).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete genre' }))

    // The count comes from the server; inventing our own wording would hide it.
    expect(await screen.findByText(/2 books still reference it/)).toBeInTheDocument()
    expect(catalog.genres.some((genre) => genre.name === 'Fantasy')).toBe(true)
  })

  it('removes a genre nothing depends on', async () => {
    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )
    await signIn(user)

    const row = (await screen.findByText('Science Fiction')).closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete genre' }))

    await waitFor(() => expect(screen.queryByText('Science Fiction')).not.toBeInTheDocument())
  })
})
