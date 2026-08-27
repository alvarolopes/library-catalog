import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { mapApiFieldErrors } from '@/shared/api/formErrors'
import type { Author } from '@/shared/api/types'
import { Dialog } from '@/shared/components/Dialog'
import { Field } from '@/shared/components/Field'
import { Button } from '@/shared/components/Button'
import { TextInput } from '@/shared/components/FormControls'
import { Alert } from '@/shared/components/Alert'

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLatestBirthDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return toDateInputValue(yesterday)
}

function isPastDate(value: string): boolean {
  if (value === '') {
    return true
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= getLatestBirthDate()
  )
}

const authorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be between 2 and 200 characters.').max(200),
  birthDate: z.string().refine(isPastDate, 'Birth date must be in the past.'),
  nationality: z
    .string()
    .trim()
    .max(100, 'Nationality must be 100 characters or fewer.')
    .optional(),
})

export type AuthorFormValues = z.infer<typeof authorSchema>

/** Fields this form renders, so a server error on anything else is not swallowed. */
const AUTHOR_FORM_FIELDS = ['name', 'birthDate', 'nationality'] as const

interface AuthorFormDialogProps {
  author?: Author
  onClose: () => void
  onSubmit: (values: {
    name: string
    birthDate: string | null
    nationality: string | null
  }) => Promise<void>
}

export function AuthorFormDialog({ author, onClose, onSubmit }: AuthorFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isEditing = author !== undefined
  const latestBirthDate = getLatestBirthDate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: author?.name ?? '',
      birthDate: author?.birthDate ?? '',
      nationality: author?.nationality ?? '',
    },
  })

  async function submit(values: AuthorFormValues) {
    setSubmitError(null)

    try {
      await onSubmit({
        name: values.name.trim(),
        // DateOnly cannot deserialize an empty string. An unset date is null.
        birthDate: values.birthDate || null,
        nationality: values.nationality?.trim() || null,
      })
      onClose()
    } catch (error) {
      if (mapApiFieldErrors(error, setError, AUTHOR_FORM_FIELDS)) {
        return
      }

      setSubmitError(
        error instanceof ApiError
          ? error.message
          : `Could not ${isEditing ? 'update' : 'create'} this author. Please try again.`,
      )
    }
  }

  return (
    <Dialog
      title={isEditing ? 'Edit author' : 'New author'}
      description="Authors identify the people who wrote the books in the catalog."
      labelledBy="author-form-title"
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

        <Field label="Birth date" error={errors.birthDate?.message}>
          <TextInput
            type="date"
            max={latestBirthDate}
            {...register('birthDate')}
          />
        </Field>

        <Field label="Nationality" error={errors.nationality?.message}>
          <TextInput
            type="text"
            {...register('nationality')}
          />
        </Field>

        {submitError && (
          <Alert>
            {submitError}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            disabled={isSubmitting}
            onClick={onClose}
            tone="ghost"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save author'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
