import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { SessionControl } from '@/features/auth/SessionControl'
import { GenresListPage } from '@/features/genres/GenresListPage'
import { catalog, makeGenre } from './msw/catalog'
import { server } from './msw/server'
import { renderWithProviders } from './test-utils'

const BASE = 'http://localhost:8080'

/** Records every genre list request so debouncing can be observed. */
function recordListRequests(): string[] {
  const searches: string[] = []

  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/api/v1/genres') {
      searches.push(url.searchParams.get('search') ?? '')
    }
  })

  return searches
}

describe('List behaviour', () => {
  it('debounces typing into one request for the final value', async () => {
    const searches = recordListRequests()
    const { user } = renderWithProviders(<GenresListPage />)
    await screen.findByText('Fantasy')

    await user.type(screen.getByRole('searchbox'), 'Fant')

    await waitFor(() => expect(searches).toContain('Fant'))
    // One request per keystroke would have queried the prefixes too.
    expect(searches).not.toContain('F')
    expect(searches).not.toContain('Fa')
  })

  it('filters the list by the search term', async () => {
    const { user } = renderWithProviders(<GenresListPage />)
    await screen.findByText('Science Fiction')

    await user.type(screen.getByRole('searchbox'), 'Fantasy')

    await waitFor(() => expect(screen.queryByText('Science Fiction')).not.toBeInTheDocument())
    expect(screen.getByText('Fantasy')).toBeInTheDocument()
  })

  it('pages through a result set larger than one page', async () => {
    // 21 genres over a page size of 20 — the boundary where a partial second page
    // appears, which is where off-by-one errors live.
    catalog.genres = Array.from({ length: 21 }, (_, index) =>
      makeGenre(`Genre ${String(index).padStart(2, '0')}`),
    )

    const { user } = renderWithProviders(<GenresListPage />)

    expect(await screen.findByText(/Page 1 of 2 — 21 total/)).toBeInTheDocument()
    expect(screen.getByText('Genre 00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument()
    expect(screen.getByText('Genre 20')).toBeInTheDocument()
  })

  it('lands on a populated page after deleting the last row of the last page', async () => {
    // The regression this pins survived two attempted fixes: the clamp read a
    // cached response for the requested page, which still carried the smaller
    // totalPages, so the user was pinned one page short.
    catalog.genres = Array.from({ length: 21 }, (_, index) =>
      makeGenre(`Genre ${String(index).padStart(2, '0')}`),
    )

    const { user } = renderWithProviders(
      <>
        <SessionControl />
        <GenresListPage />
      </>,
    )

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))
    await user.type(screen.getByLabelText('Email'), 'admin@librarycatalog.dev')
    await user.type(screen.getByLabelText('Password'), 'Admin@123')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Next' }))
    const lastRow = (await screen.findByText('Genre 20')).closest('tr') as HTMLElement

    await user.click(within(lastRow).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete genre' }))

    // Not "Page 2 of 1" and not an empty list: the user is put back on real data.
    expect(await screen.findByText(/Page 1 of 1 — 20 total/)).toBeInTheDocument()
    expect(screen.getByText('Genre 00')).toBeInTheDocument()

    // The half of the regression that the landing assertion alone does not cover.
    // The shrink leaves a cached page-2 response carrying totalPages: 1, and
    // invalidateQueries only refetches active queries — so once the list grows
    // again, a clamp reading that stale entry pins the user on page 1 for good.
    await user.click(screen.getByRole('button', { name: 'New genre' }))
    await user.type(screen.getByLabelText('Name'), 'Genre 21')
    await user.click(screen.getByRole('button', { name: 'Save genre' }))

    expect(await screen.findByText(/Page 1 of 2 — 21 total/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument()
  })

  it('reports a failed load instead of rendering an empty table', async () => {
    server.use(
      http.get(`${BASE}/api/v1/genres`, () => new HttpResponse(null, { status: 500 })),
    )

    renderWithProviders(<GenresListPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
