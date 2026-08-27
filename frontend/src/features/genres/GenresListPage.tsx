import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { genresApi } from '@/shared/api/resources'
import type { Genre } from '@/shared/api/types'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListShell, Pagination, Table } from '@/shared/components/ListShell'
import { useListQuery } from '@/shared/hooks/useListQuery'
import { useSession } from '../auth/session-context'
import { GenreFormDialog } from './GenreFormDialog'
import { Button } from '@/shared/components/Button'

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
            <Button
              onClick={() => setFormMode({ type: 'create' })}
            >
              New genre
            </Button>
          ) : undefined
        }
      >
        <Table headers={isSignedIn ? ['Name', 'Description', 'Actions'] : ['Name', 'Description']}>
          {result?.items.map((genre) => (
            <tr key={genre.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link to={`/genres/${genre.id}`} className="text-slate-900 hover:underline">
                  {genre.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{genre.description ?? '-'}</td>
              {isSignedIn && (
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button
                    onClick={() => setFormMode({ type: 'edit', genre })}
                    tone="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteError(null)
                      setGenreToDelete(genre)
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
