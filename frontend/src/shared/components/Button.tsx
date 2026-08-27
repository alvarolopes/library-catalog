import { cva, cx } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithRef } from 'react'

/**
 * One definition per button role.
 *
 * Before this existed the same button was written out at each call site, and the
 * copies had drifted: three primary buttons had no disabled styling, and ghost
 * buttons carried different padding from primary ones at the same size. Variants
 * make that impossible — there is one place where "primary" is decided.
 */
const button = cva(
  // Disabling pointer events also suppresses the hover state, which several call
  // sites had been working around individually with `enabled:hover:`.
  'rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      tone: {
        primary: 'bg-slate-900 text-white hover:bg-slate-700',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        danger: 'bg-red-700 text-white hover:bg-red-600',
        dangerGhost: 'text-red-700 hover:bg-red-50',
      },
      size: {
        sm: 'px-2.5 py-1.5',
        md: 'px-4 py-2',
      },
    },
    defaultVariants: { tone: 'primary', size: 'md' },
  },
)

export type ButtonProps = ComponentPropsWithRef<'button'> & VariantProps<typeof button>

export function Button({ tone, size, className, type = 'button', ...props }: ButtonProps) {
  // Defaults to "button": inside a form a bare <button> submits, which is rarely
  // what a Cancel or a row action means. Submitting is opted into explicitly.
  return <button type={type} className={cx(button({ tone, size }), className)} {...props} />
}
