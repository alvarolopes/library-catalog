import type { Author, Book, Genre } from '@/shared/api/types'

/**
 * A small in-memory catalog behind the MSW handlers.
 *
 * Mutations really mutate it, so cache invalidation and refetching are exercised
 * rather than assumed — a handler that always returns the same list would make
 * "the row appears after saving" pass without the app doing anything.
 */
export interface CatalogState {
  genres: Genre[]
  authors: Author[]
  books: Book[]
  /** Genre ids the API should refuse to delete, standing in for "has books". */
  genresInUse: Set<string>
}

const timestamps = { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }

export function makeGenre(name: string, id = crypto.randomUUID()): Genre {
  return { id, name, description: null, ...timestamps }
}

export function makeAuthor(name: string, id = crypto.randomUUID()): Author {
  return { id, name, birthDate: null, nationality: null, ...timestamps }
}

export function makeBook(title: string, author: Author, genre: Genre): Book {
  return {
    id: crypto.randomUUID(),
    title,
    isbn: null,
    publicationYear: null,
    author: { id: author.id, name: author.name },
    genre: { id: genre.id, name: genre.name },
    ...timestamps,
  }
}

export function createCatalog(): CatalogState {
  const fantasy = makeGenre('Fantasy')
  const sciFi = makeGenre('Science Fiction')
  const leGuin = makeAuthor('Ursula K. Le Guin')

  return {
    genres: [fantasy, sciFi],
    authors: [leGuin],
    books: [makeBook('A Wizard of Earthsea', leGuin, fantasy)],
    genresInUse: new Set([fantasy.id]),
  }
}

export let catalog = createCatalog()

export function resetCatalog(): void {
  catalog = createCatalog()
}
