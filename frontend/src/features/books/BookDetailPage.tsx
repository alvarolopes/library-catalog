import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { booksApi } from '@/shared/api/resources'
import { DetailField, DetailFields, DetailShell } from '@/shared/components/DetailShell'

export function BookDetailPage() {
  const { id = '' } = useParams()

  // Fetched rather than read from the list cache: a shared link or a refresh has
  // no list to read from, and one path beats two that can diverge.
  const query = useQuery({
    queryKey: ['books', 'detail', id],
    queryFn: () => booksApi.get(id),
  })
  const book = query.data

  return (
    <DetailShell
      title={book?.title ?? ''}
      backTo={{ to: '/books', label: 'All books' }}
      isLoading={query.isPending}
      error={query.error}
    >
      {book && (
        <DetailFields>
          <DetailField label="Author">
            <Link to={`/authors/${book.author.id}`} className="font-medium hover:underline">
              {book.author.name}
            </Link>
          </DetailField>
          <DetailField label="Genre">
            <Link to={`/genres/${book.genre.id}`} className="font-medium hover:underline">
              {book.genre.name}
            </Link>
          </DetailField>
          <DetailField label="Publication year">{book.publicationYear ?? '—'}</DetailField>
          <DetailField label="ISBN">
            <span className="font-mono text-xs">{book.isbn ?? '—'}</span>
          </DetailField>
        </DetailFields>
      )}
    </DetailShell>
  )
}
