import { cx } from 'class-variance-authority'
import { Link } from 'react-router-dom'
import type { ComponentPropsWithRef } from 'react'

/**
 * A link inside content, as opposed to navigation.
 *
 * It exists for one reason: to guarantee the hover affordance. Colour and weight
 * belong to the surrounding cell and are passed through `className`, so there is
 * no variant axis here — only the underline, which every content link must have
 * and which one of them had already lost.
 */
export function TextLink({ className, ...props }: ComponentPropsWithRef<typeof Link>) {
  return <Link className={cx('hover:underline', className)} {...props} />
}
