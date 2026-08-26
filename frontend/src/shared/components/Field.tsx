import { cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

/**
 * A labelled control with its validation message.
 *
 * The message sits outside the `label` and is attached with `aria-describedby`.
 * Nesting it inside would fold it into the control's accessible name, so a screen
 * reader would announce the field as "Name Name must be between 2 and 100
 * characters" instead of naming it and describing the problem separately.
 */
export function Field({ label, error, children }: FieldProps) {
  const errorId = useId()

  const control =
    isValidElement(children) && error
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          'aria-invalid': true,
          'aria-describedby': errorId,
        })
      : children

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
        {control}
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
