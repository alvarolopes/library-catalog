import { api } from './client'
import type {
  Author,
  Book,
  BookListParams,
  Genre,
  ListParams,
  PagedResult,
  Session,
} from './types'

export const genresApi = {
  list: (params: ListParams) => api.get<PagedResult<Genre>>('/api/v1/genres', { ...params }),
  get: (id: string) => api.get<Genre>(`/api/v1/genres/${id}`),
  create: (body: { name: string; description: string | null }) =>
    api.post<Genre>('/api/v1/genres', body),
  update: (id: string, body: { name: string; description: string | null }) =>
    api.put<void>(`/api/v1/genres/${id}`, body),
  remove: (id: string) => api.delete<void>(`/api/v1/genres/${id}`),
}

export const authorsApi = {
  list: (params: ListParams) => api.get<PagedResult<Author>>('/api/v1/authors', { ...params }),
  get: (id: string) => api.get<Author>(`/api/v1/authors/${id}`),
  create: (body: { name: string; birthDate: string | null; nationality: string | null }) =>
    api.post<Author>('/api/v1/authors', body),
  update: (
    id: string,
    body: { name: string; birthDate: string | null; nationality: string | null },
  ) => api.put<void>(`/api/v1/authors/${id}`, body),
  remove: (id: string) => api.delete<void>(`/api/v1/authors/${id}`),
}

export interface BookPayload {
  title: string
  isbn: string | null
  publicationYear: number | null
  authorId: string
  genreId: string
}

export const booksApi = {
  list: (params: BookListParams) => api.get<PagedResult<Book>>('/api/v1/books', { ...params }),
  get: (id: string) => api.get<Book>(`/api/v1/books/${id}`),
  create: (body: BookPayload) => api.post<Book>('/api/v1/books', body),
  update: (id: string, body: BookPayload) => api.put<void>(`/api/v1/books/${id}`, body),
  remove: (id: string) => api.delete<void>(`/api/v1/books/${id}`),
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<Session>('/api/v1/auth/login', body),
}
