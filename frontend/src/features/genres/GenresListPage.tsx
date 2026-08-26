import { genresApi } from '@/shared/api/resources'
import type { Genre } from '@/shared/api/types'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'

export function GenresListPage() {
  const { search, setSearch, setPage, query } = useListQuery<Genre>('genres', genresApi.list)
  const result = query.data

  return (
    <ListShell
      title="Genres"
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isPending}
      error={query.error}
      isEmpty={result?.items.length === 0}
    >
      <Table headers={['Name', 'Description']}>
        {result?.items.map((genre) => (
          <tr key={genre.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium">{genre.name}</td>
            <td className="px-4 py-3 text-slate-600">{genre.description ?? '—'}</td>
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
