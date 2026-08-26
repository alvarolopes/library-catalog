import { booksApi } from '@/shared/api/resources'
import type { Book } from '@/shared/api/types'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'

export function BooksListPage() {
  const { search, setSearch, setPage, query } = useListQuery<Book>('books', booksApi.list)
  const result = query.data

  return (
    <ListShell
      title="Books"
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isPending}
      error={query.error}
      isEmpty={result?.items.length === 0}
    >
      <Table headers={['Title', 'Author', 'Genre', 'Year', 'ISBN']}>
        {result?.items.map((book) => (
          <tr key={book.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{book.title}</td>
            <td className="px-4 py-3 text-slate-600">{book.author.name}</td>
            <td className="px-4 py-3 text-slate-600">{book.genre.name}</td>
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
