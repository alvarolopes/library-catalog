import { cx } from 'class-variance-authority'
import type { ReactNode } from 'react'

/**
 * The full-width placeholder a list or detail page shows instead of content:
 * loading, empty, or failed. Was written out identically in both shells, which
 * is how the two copies stayed in step only by luck.
 *
 * `role="alert"` is applied only to the error tone — announcing "Loading..." or
 * "no records" as an alert would interrupt a screen-reader user for no reason.
 */
export function StatusMessage({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'error'
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={cx(
        'rounded-md border px-4 py-8 text-center text-sm',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-white text-slate-500',
      )}
    >
      {children}
    </p>
  )
}
