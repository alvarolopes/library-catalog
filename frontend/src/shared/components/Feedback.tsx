import { cx } from 'class-variance-authority'
import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * A form-level failure, shown inside the dialog that produced it — a duplicate
 * name, a refused delete, a request that did not reach the server.
 *
 * No tone variant: an alert is only ever raised for a failure here. An axis with
 * a single value is not a variant, it is a default with extra steps.
 */
export function Alert({ className, children, ...props }: ComponentPropsWithRef<'p'>) {
  return (
    <p
      role="alert"
      className={cx('rounded-md bg-red-50 px-3 py-2 text-sm text-red-700', className)}
      {...props}
    >
      {children}
    </p>
  )
}

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
