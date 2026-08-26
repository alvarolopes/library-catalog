import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './client'

/** FluentValidation reports property names in PascalCase; form fields are camelCase. */
function toFormFieldName(apiField: string): string {
  return apiField.charAt(0).toLowerCase() + apiField.slice(1)
}

/**
 * Attaches a problem response's field errors to the matching form fields.
 *
 * Returns whether the user will actually see something. Callers use that to decide
 * whether to fall back to a form-level message, so an error keyed on a field this
 * form does not render must not count — reporting it as handled would leave the
 * dialog refusing to submit with no explanation anywhere. `formFields` is the
 * allowlist that keeps that honest.
 */
export function mapApiFieldErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  formFields: readonly Path<TValues>[],
): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }

  let mappedAny = false

  for (const [apiField, messages] of Object.entries(error.fieldErrors)) {
    const field = toFormFieldName(apiField) as Path<TValues>

    if (!formFields.includes(field) || messages.length === 0) {
      continue
    }

    // The API returns every violation for a field at once; showing one at a time
    // would walk the user through them over separate round trips.
    setError(field, { type: 'server', message: messages.join(' ') })
    mappedAny = true
  }

  return mappedAny
}
