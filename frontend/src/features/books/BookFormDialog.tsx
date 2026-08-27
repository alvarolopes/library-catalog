import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@/shared/components/Button'
import { TextInput, Select } from '@/shared/components/FormControls'
import { Alert } from '@/shared/components/Feedback'

const REFERENCE_LIST_PARAMS = { page: 1, pageSize: 100, sortBy: 'name' } as const

/**
 * Mirrors the server's `Isbn.Normalize`, which keeps letters and digits and drops
 * everything else. Stripping only spaces and hyphens would reject values the API
 * happily accepts — `978.0.306.40615.7` stores as `9780306406157`.
 */
function normalizeIsbn(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '')
}

function isIsbnShape(value: string): boolean {
  const normalized = normalizeIsbn(value)

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

interface MissingResource {
  /** The book itself is gone, as opposed to something it points at. */
  isTheBook: boolean
  message: string
}

/**
 * The API reports every absent record as `resource-not-found` and only the detail
 * text says which one, so telling them apart means reading that text. That is a
 * coupling to the server's wording — but the alternative is showing the user the
 * raw detail, which quotes a GUID. The fallback below keeps that from ever
 * happening if the wording changes.
 *
 * A machine-readable `resource` on the problem response would remove the parsing
 * entirely; that belongs with the error-envelope work in #14.
 */
function describeMissingResource(error: unknown): MissingResource | null {
  if (!(error instanceof ApiError) || error.problem?.type !== 'resource-not-found') {
    return null
  }

  const detail = error.problem.detail ?? ''

  if (detail.startsWith("book '")) {
    return {
      isTheBook: true,
      message: 'This book no longer exists — someone else may have deleted it.',
    }
  }

  if (detail.startsWith("author '") || detail.startsWith("genre '")) {
    return {
      isTheBook: false,
      message: 'The selected author or genre no longer exists. Please choose another and try again.',
    }
  }

  return {
    isTheBook: false,
    message: 'Something this book refers to no longer exists. Please review the form and try again.',
  }
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
  const queryClient = useQueryClient()
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
      const missing = describeMissingResource(error)

      if (missing) {
        if (missing.isTheBook) {
          // The row the user opened is gone, so the list behind this dialog is
          // showing something that no longer exists.
          void queryClient.invalidateQueries({ queryKey: ['books'] })
        } else {
          void authorsQuery.refetch()
          void genresQuery.refetch()
        }

        setSubmitError(missing.message)
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
          <TextInput
            type="text"
            autoFocus
            {...register('title')}
          />
        </Field>

        <Field label="ISBN" error={errors.isbn?.message}>
          <TextInput
            type="text"
            inputMode="text"
            {...register('isbn')}
          />
        </Field>

        <Field label="Publication year" error={errors.publicationYear?.message}>
          <TextInput
            type="number"
            min="1450"
            max={latestPublicationYear}
            step="1"
            {...register('publicationYear')}
          />
        </Field>

        <Field label="Author" error={errors.authorId?.message}>
          <Select
            {...register('authorId')}
            disabled={isLoadingReferences || hasReferenceLoadError}
          >
            <option value="">{isLoadingReferences ? 'Loading authors...' : 'Select an author'}</option>
            {authorOptions.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Genre" error={errors.genreId?.message}>
          <Select
            {...register('genreId')}
            disabled={isLoadingReferences || hasReferenceLoadError}
          >
            <option value="">{isLoadingReferences ? 'Loading genres...' : 'Select a genre'}</option>
            {genreOptions.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </Select>
        </Field>

        {hasReferenceLoadError && (
          <Alert>
            Could not load the author and genre choices. Please close and try again.
          </Alert>
        )}

        {submitError && (
          <Alert>
            {submitError}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            onClick={onClose}
            tone="ghost"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingReferences || hasReferenceLoadError}
          >
            {isSubmitting ? 'Saving...' : 'Save book'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
