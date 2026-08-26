import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { booksApi } from '@/shared/api/resources'
import type { BookPayload } from '@/shared/api/resources'
import type { Book } from '@/shared/api/types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'
import { useSession } from '../auth/session-context'
import { BookFormDialog } from './BookFormDialog'

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
            <button
              type="button"
              onClick={() => setFormMode({ type: 'create' })}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              New book
            </button>
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
                <Link to={`/books/${book.id}`} className="text-slate-900 hover:underline">
                  {book.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <Link to={`/authors/${book.author.id}`} className="hover:underline">
                  {book.author.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <Link to={`/genres/${book.genre.id}`} className="hover:underline">
                  {book.genre.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{book.publicationYear ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{book.isbn ?? '—'}</td>
              {isSignedIn && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setFormMode({ type: 'edit', book })}
                    className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setBookToDelete(book)
                    }}
                    className="ml-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
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
