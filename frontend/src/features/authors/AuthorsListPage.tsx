import { authorsApi } from '@/shared/api/resources'
import type { Author } from '@/shared/api/types'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'

export function AuthorsListPage() {
  const { search, setSearch, setPage, query } = useListQuery<Author>('authors', authorsApi.list)
  const result = query.data

  return (
    <ListShell
      title="Authors"
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isPending}
      error={query.error}
      isEmpty={result?.items.length === 0}
    >
      <Table headers={['Name', 'Born', 'Nationality']}>
        {result?.items.map((author) => (
          <tr key={author.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{author.name}</td>
            <td className="px-4 py-3 text-slate-600">{author.birthDate ?? '—'}</td>
            <td className="px-4 py-3 text-slate-600">{author.nationality ?? '—'}</td>
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
