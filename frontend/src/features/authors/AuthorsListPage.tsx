import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { authorsApi } from '@/shared/api/resources'
import type { Author } from '@/shared/api/types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'
import { useSession } from '../auth/session-context'
import { AuthorFormDialog } from './AuthorFormDialog'

type AuthorFormMode = { type: 'create' } | { type: 'edit'; author: Author }

export function AuthorsListPage() {
  const queryClient = useQueryClient()
  const { isSignedIn } = useSession()
  const { search, setSearch, setPage, query } = useListQuery<Author>('authors', authorsApi.list)
  const result = query.data
  const [formMode, setFormMode] = useState<AuthorFormMode | null>(null)
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const invalidateAuthors = () => queryClient.invalidateQueries({ queryKey: ['authors'] })

  const createAuthor = useMutation({
    mutationFn: authorsApi.create,
    onSuccess: invalidateAuthors,
  })

  const updateAuthor = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { name: string; birthDate: string | null; nationality: string | null }
    }) => authorsApi.update(id, body),
    onSuccess: invalidateAuthors,
  })

  const deleteAuthor = useMutation({
    mutationFn: authorsApi.remove,
    onSuccess: () => {
      setAuthorToDelete(null)
      setDeleteError(null)
      void invalidateAuthors()
    },
    onError: (error) => {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Could not delete this author. Please try again.',
      )
    },
  })

  return (
    <>
      <ListShell
        title="Authors"
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
              New author
            </button>
          ) : undefined
        }
      >
        <Table headers={isSignedIn ? ['Name', 'Born', 'Nationality', 'Actions'] : ['Name', 'Born', 'Nationality']}>
          {result?.items.map((author) => (
            <tr key={author.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link to={`/authors/${author.id}`} className="text-slate-900 hover:underline">
                  {author.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{author.birthDate ?? '-'}</td>
              <td className="px-4 py-3 text-slate-600">{author.nationality ?? '-'}</td>
              {isSignedIn && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setFormMode({ type: 'edit', author })}
                    className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setAuthorToDelete(author)
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
        <AuthorFormDialog
          author={formMode.type === 'edit' ? formMode.author : undefined}
          onClose={() => setFormMode(null)}
          onSubmit={async (values) => {
            if (formMode.type === 'edit') {
              await updateAuthor.mutateAsync({ id: formMode.author.id, body: values })
              return
            }

            await createAuthor.mutateAsync(values)
          }}
        />
      )}

      {authorToDelete && (
        <ConfirmDialog
          title="Delete author"
          description={`Delete "${authorToDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete author"
          isSubmitting={deleteAuthor.isPending}
          error={deleteError}
          onCancel={() => {
            setAuthorToDelete(null)
            setDeleteError(null)
          }}
          onConfirm={() => deleteAuthor.mutate(authorToDelete.id)}
        />
      )}
    </>
  )
}
