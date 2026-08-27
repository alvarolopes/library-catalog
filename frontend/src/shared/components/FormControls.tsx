import { cx } from 'class-variance-authority'
import type { ComponentPropsWithRef } from 'react'

/**
 * The shared look of every form control. Written out nine times across the form
 * dialogs before this existed, which is nine chances for one of them to fall
 * behind the others.
 *
 * No variants: a text box, a select and a textarea differ in the element, not in
 * their appearance, so a variant axis here would have exactly one value.
 */
const control =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50'

export function TextInput({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={cx(control, className)} {...props} />
}

export function TextArea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={cx(control, 'resize-y', className)} {...props} />
}

export function Select({ className, ...props }: ComponentPropsWithRef<'select'>) {
  return <select className={cx(control, className)} {...props} />
}
