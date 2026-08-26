import { Link } from 'react-router-dom'
import { booksApi } from '@/shared/api/resources'
import type { Book, ListParams } from '@/shared/api/types'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'

interface RelatedBooksListProps {
  title: string
  emptyMessage: string
  /** Exactly one of these; the API filters on either. */
  filter: { authorId: string } | { genreId: string }
  /** Which relationship is already implied by the surrounding page. */
  omitColumn: 'author' | 'genre'
}

/**
 * The books belonging to one author or one genre.
 *
 * The cache key carries the filter, so paging an author's books never disturbs the
 * main book list or another author's — they are different result sets that happen
 * to come from the same endpoint.
 */
export function RelatedBooksList({
  title,
  emptyMessage,
  filter,
  omitColumn,
}: RelatedBooksListProps) {
  const filterKey = 'authorId' in filter ? `author:${filter.authorId}` : `genre:${filter.genreId}`

  const { search, setSearch, setPage, query } = useListQuery<Book>(
    `books:${filterKey}`,
    (params: ListParams) => booksApi.list({ ...params, ...filter }),
  )
  const result = query.data

  // The column the surrounding page already establishes would be the same value on
  // every row, so it earns no space.
  const headers =
    omitColumn === 'author'
      ? ['Title', 'Genre', 'Year', 'ISBN']
      : ['Title', 'Author', 'Year', 'ISBN']

  return (
    <ListShell
      title={title}
      headingLevel={2}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isPending}
      error={query.error}
      isEmpty={result?.items.length === 0}
      emptyMessage={emptyMessage}
    >
      <Table headers={headers}>
        {result?.items.map((book) => (
          <tr key={book.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">
              <Link to={`/books/${book.id}`} className="text-slate-900 hover:underline">
                {book.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-slate-600">
              {omitColumn === 'author' ? (
                <Link to={`/genres/${book.genre.id}`} className="hover:underline">
                  {book.genre.name}
                </Link>
              ) : (
                <Link to={`/authors/${book.author.id}`} className="hover:underline">
                  {book.author.name}
                </Link>
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">{book.publicationYear ?? '—'}</td>
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{book.isbn ?? '—'}</td>
          </tr>
        ))}
      </Table>

      {result && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          totalItems={result.totalItems}
          onPageChange={setPage}
        />
      )}
    </ListShell>
  )
}
