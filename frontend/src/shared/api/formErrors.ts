import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './client'

function toFormFieldName(apiField: string): string {
  return apiField.charAt(0).toLowerCase() + apiField.slice(1)
}

export function mapApiFieldErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }

  const entries = Object.entries(error.fieldErrors)

  for (const [apiField, messages] of entries) {
    const message = messages[0]

    if (message) {
      setError(toFormFieldName(apiField) as Path<TValues>, { type: 'server', message })
    }
  }

  return entries.length > 0
}
