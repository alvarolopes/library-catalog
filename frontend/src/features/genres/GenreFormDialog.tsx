import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { mapApiFieldErrors } from '@/shared/api/formErrors'
import type { Genre } from '@/shared/api/types'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'

const genreSchema = z.object({
  name: z.string().trim().min(2, 'Name must be between 2 and 100 characters.').max(100),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional(),
})

export type GenreFormValues = z.infer<typeof genreSchema>

/** Fields this form renders, so a server error on anything else is not swallowed. */
const GENRE_FORM_FIELDS = ['name', 'description'] as const

interface GenreFormDialogProps {
  genre?: Genre
  onClose: () => void
  onSubmit: (values: { name: string; description: string | null }) => Promise<void>
}

export function GenreFormDialog({ genre, onClose, onSubmit }: GenreFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditing = genre !== undefined

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GenreFormValues>({
    resolver: zodResolver(genreSchema),
    defaultValues: {
      name: genre?.name ?? '',
      description: genre?.description ?? '',
    },
  })

  async function submit(values: GenreFormValues) {
    setSubmitError(null)

    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description?.trim() || null,
      })
      onClose()
    } catch (error) {
      if (mapApiFieldErrors(error, setError, GENRE_FORM_FIELDS)) {
        return
      }

      setSubmitError(
        error instanceof ApiError
          ? error.message
          : `Could not ${isEditing ? 'update' : 'create'} this genre. Please try again.`,
      )
    }
  }

  return (
    <Dialog
      title={isEditing ? 'Edit genre' : 'New genre'}
      description="Genres organize books into browseable categories."
      labelledBy="genre-form-title"
      onClose={onClose}
      isBusy={isSubmitting}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <Field label="Name" error={errors.name?.message}>
          <input
            type="text"
            autoFocus
            {...register('name')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            rows={4}
            {...register('description')}
            className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </Field>

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
            disabled={isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save genre'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
