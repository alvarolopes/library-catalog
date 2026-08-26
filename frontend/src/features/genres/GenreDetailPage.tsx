import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { RelatedBooksList } from '@/features/books/RelatedBooksList'
import { genresApi } from '@/shared/api/resources'
import { DetailField, DetailFields, DetailShell } from '@/shared/components/DetailShell'

export function GenreDetailPage() {
  const { id = '' } = useParams()

  const query = useQuery({
    queryKey: ['genres', 'detail', id],
    queryFn: () => genresApi.get(id),
  })
  const genre = query.data

  return (
    <DetailShell
      title={genre?.name ?? ''}
      backTo={{ to: '/genres', label: 'All genres' }}
      isLoading={query.isPending}
      error={query.error}
    >
      {genre && (
        <>
          <DetailFields>
            <DetailField label="Description">{genre.description ?? '—'}</DetailField>
          </DetailFields>

          <RelatedBooksList
            title="Books in this genre"
            emptyMessage="No books are filed under this genre yet."
            filter={{ genreId: genre.id }}
            omitColumn="genre"
          />
        </>
      )}
    </DetailShell>
  )
}
