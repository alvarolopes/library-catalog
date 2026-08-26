import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { mapApiFieldErrors } from '@/shared/api/formErrors'
import { authorsApi, genresApi } from '@/shared/api/resources'
import type { Book } from '@/shared/api/types'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'

const REFERENCE_LIST_PARAMS = { page: 1, pageSize: 100, sortBy: 'name' } as const

function isIsbnShape(value: string): boolean {
  const normalized = value.replace(/[\s-]/g, '')

  return (
    normalized === '' ||
    /^\d{9}[\dXx]$/.test(normalized) ||
    /^\d{13}$/.test(normalized)
  )
}

function getLatestPublicationYear(): number {
  return new Date().getUTCFullYear() + 1
}

function isPublicationYear(value: string): boolean {
  if (value === '') {
    return true
  }

  const year = Number(value)

  return /^\d{4}$/.test(value) && year >= 1450 && year <= getLatestPublicationYear()
}

function isMissingReference(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.problem?.type !== 'resource-not-found') {
    return false
  }

  const detail = error.problem.detail ?? ''

  return detail.startsWith("author '") || detail.startsWith("genre '")
}

const bookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title must be 200 characters or fewer.'),
  // The server remains responsible for the ISBN checksum; the client only rules
  // out values that cannot be an ISBN at all.
  isbn: z.string().refine(isIsbnShape, 'Enter a 10 or 13 digit ISBN.'),
  publicationYear: z
    .string()
    .refine(isPublicationYear, 'Publication year must be from 1450 through next year.'),
  authorId: z.string().min(1, 'Author is required.'),
  genreId: z.string().min(1, 'Genre is required.'),
})

export type BookFormValues = z.infer<typeof bookSchema>

/** Fields this form renders, so a server error on anything else is not swallowed. */
const BOOK_FORM_FIELDS = ['title', 'isbn', 'publicationYear', 'authorId', 'genreId'] as const

interface BookFormDialogProps {
  book?: Book
  onClose: () => void
  onSubmit: (values: {
    title: string
    isbn: string | null
    publicationYear: number | null
    authorId: string
    genreId: string
  }) => Promise<void>
}

export function BookFormDialog({ book, onClose, onSubmit }: BookFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditing = book !== undefined
  const latestPublicationYear = getLatestPublicationYear()
  const authorsQuery = useQuery({
    queryKey: ['authors', 'book-form-options', REFERENCE_LIST_PARAMS],
    queryFn: () => authorsApi.list(REFERENCE_LIST_PARAMS),
  })
  const genresQuery = useQuery({
    queryKey: ['genres', 'book-form-options', REFERENCE_LIST_PARAMS],
    queryFn: () => genresApi.list(REFERENCE_LIST_PARAMS),
  })

  const authors = authorsQuery.data?.items ?? []
  const genres = genresQuery.data?.items ?? []
  const authorOptions =
    book && !authors.some((author) => author.id === book.author.id)
      ? [book.author, ...authors]
      : authors
  const genreOptions =
    book && !genres.some((genre) => genre.id === book.genre.id)
      ? [book.genre, ...genres]
      : genres
  const isLoadingReferences = authorsQuery.isPending || genresQuery.isPending
  const hasReferenceLoadError = authorsQuery.isError || genresQuery.isError

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book?.title ?? '',
      isbn: book?.isbn ?? '',
      publicationYear: book?.publicationYear?.toString() ?? '',
      authorId: book?.author.id ?? '',
      genreId: book?.genre.id ?? '',
    },
  })

  async function submit(values: BookFormValues) {
    setSubmitError(null)

    try {
      await onSubmit({
        title: values.title.trim(),
        isbn: values.isbn.trim() || null,
        // An untouched number input is an empty string, which must become null
        // before ASP.NET tries to bind it to a nullable integer.
        publicationYear: values.publicationYear === '' ? null : Number(values.publicationYear),
        authorId: values.authorId,
        genreId: values.genreId,
      })
      onClose()
    } catch (error) {
      if (isMissingReference(error)) {
        void authorsQuery.refetch()
        void genresQuery.refetch()
        setSubmitError(
          'The selected author or genre no longer exists. Please choose another and try again.',
        )
        return
      }

      if (mapApiFieldErrors(error, setError, BOOK_FORM_FIELDS)) {
        return
      }

      setSubmitError(
        error instanceof ApiError
          ? error.message
          : `Could not ${isEditing ? 'update' : 'create'} this book. Please try again.`,
      )
    }
  }

  return (
    <Dialog
      title={isEditing ? 'Edit book' : 'New book'}
      description="Books connect a title with its author and genre."
      labelledBy="book-form-title"
      onClose={onClose}
      isBusy={isSubmitting}
      maxWidthClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field label="Title" error={errors.title?.message}>
          <input
            type="text"
            autoFocus
            {...register('title')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="ISBN" error={errors.isbn?.message}>
          <input
            type="text"
            inputMode="text"
            {...register('isbn')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="Publication year" error={errors.publicationYear?.message}>
          <input
            type="number"
            min="1450"
            max={latestPublicationYear}
            step="1"
            {...register('publicationYear')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="Author" error={errors.authorId?.message}>
          <select
            {...register('authorId')}
            disabled={isLoadingReferences || hasReferenceLoadError}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{isLoadingReferences ? 'Loading authors...' : 'Select an author'}</option>
            {authorOptions.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Genre" error={errors.genreId?.message}>
          <select
            {...register('genreId')}
            disabled={isLoadingReferences || hasReferenceLoadError}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{isLoadingReferences ? 'Loading genres...' : 'Select a genre'}</option>
            {genreOptions.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </Field>

        {hasReferenceLoadError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not load the author and genre choices. Please close and try again.
          </p>
        )}

        {submitError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingReferences || hasReferenceLoadError}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save book'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
