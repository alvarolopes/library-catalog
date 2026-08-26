import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/shared/api/client'
import { genresApi } from '@/shared/api/resources'
import type { Genre } from '@/shared/api/types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'
import { useSession } from '../auth/session'
import { GenreFormDialog } from './GenreFormDialog'

type GenreFormMode = { type: 'create' } | { type: 'edit'; genre: Genre }

export function GenresListPage() {
  const queryClient = useQueryClient()
  const { isSignedIn } = useSession()
  const { search, setSearch, setPage, query } = useListQuery<Genre>('genres', genresApi.list)
  const result = query.data
  const [formMode, setFormMode] = useState<GenreFormMode | null>(null)
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const invalidateGenres = () => queryClient.invalidateQueries({ queryKey: ['genres'] })

  const createGenre = useMutation({
    mutationFn: genresApi.create,
    onSuccess: invalidateGenres,
  })

  const updateGenre = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: { name: string; description: string | null }
    }) => genresApi.update(id, body),
    onSuccess: invalidateGenres,
  })

  const deleteGenre = useMutation({
    mutationFn: genresApi.remove,
    onSuccess: () => {
      setGenreToDelete(null)
      setDeleteError(null)
      void invalidateGenres()
    },
    onError: (error) => {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Could not delete this genre. Please try again.',
      )
    },
  })

  return (
    <>
      <ListShell
        title="Genres"
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
              New genre
            </button>
          ) : undefined
        }
      >
        <Table headers={isSignedIn ? ['Name', 'Description', 'Actions'] : ['Name', 'Description']}>
          {result?.items.map((genre) => (
            <tr key={genre.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{genre.name}</td>
              <td className="px-4 py-3 text-slate-600">{genre.description ?? '-'}</td>
              {isSignedIn && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setFormMode({ type: 'edit', genre })}
                    className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setGenreToDelete(genre)
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
        <GenreFormDialog
          genre={formMode.type === 'edit' ? formMode.genre : undefined}
          onClose={() => setFormMode(null)}
          onSubmit={async (values) => {
            if (formMode.type === 'edit') {
              await updateGenre.mutateAsync({ id: formMode.genre.id, body: values })
              return
            }

            await createGenre.mutateAsync(values)
          }}
        />
      )}

      {genreToDelete && (
        <ConfirmDialog
          title="Delete genre"
          description={`Delete "${genreToDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete genre"
          isSubmitting={deleteGenre.isPending}
          error={deleteError}
          onCancel={() => {
            setGenreToDelete(null)
            setDeleteError(null)
          }}
          onConfirm={() => deleteGenre.mutate(genreToDelete.id)}
        />
      )}
    </>
  )
}
