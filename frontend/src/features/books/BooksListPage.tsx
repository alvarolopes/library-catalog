import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/shared/api/client'
import { booksApi } from '@/shared/api/resources'
import type { BookPayload } from '@/shared/api/resources'
import type { Book } from '@/shared/api/types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListShell } from '@/shared/components/ListShell'
import { Pagination } from '@/shared/components/Pagination'
import { Table } from '@/shared/components/Table'
import { useListQuery } from '@/shared/hooks/useListQuery'
import { useSession } from '../auth/session-context'
import { BookFormDialog } from './BookFormDialog'
import { Button } from '@/shared/components/Button'
import { TextLink } from '@/shared/components/TextLink'

type BookFormMode = { type: 'create' } | { type: 'edit'; book: Book }

export function BooksListPage() {
  const queryClient = useQueryClient()
  const { isSignedIn } = useSession()
  const { search, setSearch, setPage, query } = useListQuery<Book>('books', booksApi.list)
  const result = query.data
  const [formMode, setFormMode] = useState<BookFormMode | null>(null)
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const invalidateBooks = () => queryClient.invalidateQueries({ queryKey: ['books'] })

  const createBook = useMutation({
    mutationFn: booksApi.create,
    onSuccess: invalidateBooks,
  })

  const updateBook = useMutation({
    mutationFn: ({ id, body }: { id: string; body: BookPayload }) => booksApi.update(id, body),
    onSuccess: invalidateBooks,
  })

  const deleteBook = useMutation({
    mutationFn: booksApi.remove,
    onSuccess: () => {
      setBookToDelete(null)
      setDeleteError(null)
      void invalidateBooks()
    },
    onError: (error) => {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Could not delete this book. Please try again.',
      )
    },
  })

  return (
    <>
      <ListShell
        title="Books"
        search={search}
        onSearchChange={setSearch}
        isLoading={query.isPending}
        error={query.error}
        isEmpty={result?.items.length === 0}
        actions={
          isSignedIn ? (
            <Button
              onClick={() => setFormMode({ type: 'create' })}
            >
              New book
            </Button>
          ) : undefined
        }
      >
        <Table
          headers={
            isSignedIn
              ? ['Title', 'Author', 'Genre', 'Year', 'ISBN', 'Actions']
              : ['Title', 'Author', 'Genre', 'Year', 'ISBN']
          }
        >
          {result?.items.map((book) => (
            <tr key={book.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <TextLink to={`/books/${book.id}`} className="text-slate-900 hover:underline">
                  {book.title}
                </TextLink>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <TextLink to={`/authors/${book.author.id}`} className="hover:underline">
                  {book.author.name}
                </TextLink>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <TextLink to={`/genres/${book.genre.id}`} className="hover:underline">
                  {book.genre.name}
                </TextLink>
              </td>
              <td className="px-4 py-3 text-slate-600">{book.publicationYear ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{book.isbn ?? '—'}</td>
              {isSignedIn && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button
                    onClick={() => setFormMode({ type: 'edit', book })}
                    tone="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteError(null)
                      setBookToDelete(book)
                    }}
                    tone="dangerGhost"
                    size="sm"
                    className="ml-1"
                  >
                    Delete
                  </Button>
                </td>
              )}
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

      {formMode && (
        <BookFormDialog
          book={formMode.type === 'edit' ? formMode.book : undefined}
          onClose={() => setFormMode(null)}
          onSubmit={async (values) => {
            if (formMode.type === 'edit') {
              await updateBook.mutateAsync({ id: formMode.book.id, body: values })
              return
            }

            await createBook.mutateAsync(values)
          }}
        />
      )}

      {bookToDelete && (
        <ConfirmDialog
          title="Delete book"
          description={`Delete "${bookToDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete book"
          isSubmitting={deleteBook.isPending}
          error={deleteError}
          onCancel={() => {
            setBookToDelete(null)
            setDeleteError(null)
          }}
          onConfirm={() => deleteBook.mutate(bookToDelete.id)}
        />
      )}
    </>
  )
}
