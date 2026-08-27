import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { mapApiFieldErrors } from '@/shared/api/formErrors'
import type { Genre } from '@/shared/api/types'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'
import { Button } from '@/shared/components/Button'
import { TextInput, TextArea } from '@/shared/components/FormControls'
import { Alert } from '@/shared/components/Feedback'

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
          <TextInput
            type="text"
            autoFocus
            {...register('name')}
          />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <TextArea
            rows={4}
            {...register('description')}
          />
        </Field>

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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save genre'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
