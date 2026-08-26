import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { RelatedBooksList } from '@/features/books/RelatedBooksList'
import { authorsApi } from '@/shared/api/resources'
import { DetailField, DetailFields, DetailShell } from '@/shared/components/DetailShell'

export function AuthorDetailPage() {
  const { id = '' } = useParams()

  const query = useQuery({
    queryKey: ['authors', 'detail', id],
    queryFn: () => authorsApi.get(id),
  })
  const author = query.data

  return (
    <DetailShell
      title={author?.name ?? ''}
      backTo={{ to: '/authors', label: 'All authors' }}
      isLoading={query.isPending}
      error={query.error}
    >
      {author && (
        <>
          <DetailFields>
            <DetailField label="Born">{author.birthDate ?? '—'}</DetailField>
            <DetailField label="Nationality">{author.nationality ?? '—'}</DetailField>
          </DetailFields>

          <RelatedBooksList
            title="Books by this author"
            emptyMessage="This author has no books in the catalog yet."
            filter={{ authorId: author.id }}
            omitColumn="author"
          />
        </>
      )}
    </DetailShell>
  )
}
