export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface Genre {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Author {
  id: string
  name: string
  birthDate: string | null
  nationality: string | null
  createdAt: string
  updatedAt: string
}

/** The API embeds the resolved author and genre, so a book row never needs a second call. */
export interface Book {
  id: string
  title: string
  isbn: string | null
  publicationYear: number | null
  author: { id: string; name: string }
  genre: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface Session {
  token: string
  expiresAt: string
  email: string
  role: string
}

export type SortDirection = 'asc' | 'desc'

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: SortDirection
}

export interface BookListParams extends ListParams {
  authorId?: string
  genreId?: string
}

/** RFC 9457 problem response, as shaped by the API's global exception handler. */
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  correlationId?: string
  errors?: Record<string, string[]>
}
