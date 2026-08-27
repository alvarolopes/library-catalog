import { cx } from 'class-variance-authority'
import type { ComponentPropsWithRef } from 'react'

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
