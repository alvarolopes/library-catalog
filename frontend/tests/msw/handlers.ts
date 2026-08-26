import { HttpResponse, http } from 'msw'
import type { PagedResult } from '@/shared/api/types'
import { catalog, makeGenre } from './catalog'

const BASE = 'http://localhost:8080'

/**
 * The shapes below are copied from the running API, not invented. A fixture that
 * disagrees with the server tests the fixture: the `type` is a bare slug rather
 * than a URL, and `errors` is keyed in PascalCase because FluentValidation reports
 * property names that way — which is exactly what the client has to map back onto
 * camelCase form fields.
 */
export function problem(
  status: number,
  type: string,
  detail: string,
  errors?: Record<string, string[]>,
) {
  return HttpResponse.json(
    {
      type,
      title: 'Request failed.',
      status,
      detail,
      instance: '/api/v1/genres',
      correlationId: '01a03ea5-0000-7000-8000-000000000000',
      ...(errors ? { errors } : {}),
    },
    { status },
  )
}

function paged<T>(items: T[], page: number, pageSize: number): PagedResult<T> {
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

function readListParams(request: Request) {
  const url = new URL(request.url)

  return {
    search: url.searchParams.get('search') ?? '',
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 20),
  }
}

function requireStaff(request: Request) {
  return request.headers.get('Authorization')?.startsWith('Bearer ')
    ? null
    : problem(401, 'unauthorized', 'Authentication is required.')
}

export const handlers = [
  http.post(`${BASE}/api/v1/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }

    if (password !== 'Admin@123') {
      return problem(401, 'invalid-credentials', 'Email or password is incorrect.')
    }

    return HttpResponse.json({
      token: 'test-token',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      email,
      role: 'staff',
    })
  }),

  http.get(`${BASE}/api/v1/genres`, ({ request }) => {
    const { search, page, pageSize } = readListParams(request)
    const matches = catalog.genres.filter((genre) =>
      genre.name.toLowerCase().includes(search.toLowerCase()),
    )

    return HttpResponse.json(paged(matches, page, pageSize))
  }),

  http.post(`${BASE}/api/v1/genres`, async ({ request }) => {
    const unauthorized = requireStaff(request)
    if (unauthorized) return unauthorized

    const body = (await request.json()) as { name: string }

    if (catalog.genres.some((genre) => genre.name.toLowerCase() === body.name.toLowerCase())) {
      return problem(
        409,
        'duplicate-resource',
        `A genre with name '${body.name}' already exists.`,
      )
    }

    const genre = makeGenre(body.name)
    catalog.genres.push(genre)

    return HttpResponse.json(genre, { status: 201 })
  }),

  http.delete(`${BASE}/api/v1/genres/:id`, ({ request, params }) => {
    const unauthorized = requireStaff(request)
    if (unauthorized) return unauthorized

    const id = params.id as string

    if (catalog.genresInUse.has(id)) {
      return problem(
        409,
        'resource-in-use',
        'This genre cannot be deleted because 2 books still reference it.',
      )
    }

    catalog.genres = catalog.genres.filter((genre) => genre.id !== id)

    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/api/v1/authors`, ({ request }) => {
    const { search, page, pageSize } = readListParams(request)
    const matches = catalog.authors.filter((author) =>
      author.name.toLowerCase().includes(search.toLowerCase()),
    )

    return HttpResponse.json(paged(matches, page, pageSize))
  }),

  http.get(`${BASE}/api/v1/books`, ({ request }) => {
    const { search, page, pageSize } = readListParams(request)
    const matches = catalog.books.filter((book) =>
      book.title.toLowerCase().includes(search.toLowerCase()),
    )

    return HttpResponse.json(paged(matches, page, pageSize))
  }),
]
