import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

interface DialogProps {
  title: string
  description?: string
  labelledBy: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
  /**
   * While a request is in flight, Escape and backdrop clicks are ignored. Explicit
   * Cancel controls remain available so a hung request never traps the user here.
   */
  isBusy?: boolean
}

export function Dialog({
  title,
  description,
  labelledBy,
  onClose,
  children,
  maxWidthClassName = 'max-w-sm',
  isBusy = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const pressStartedOnBackdrop = useRef(false)

  const requestClose = useCallback(() => {
    if (!isBusy) {
      onClose()
    }
  }, [isBusy, onClose])

  // Move focus into the dialog on open, and hand it back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current

    // An autoFocus'd child has already claimed focus by the time effects run.
    // Only step in when nothing inside did — a confirmation dialog, for instance,
    // is all buttons, and a real mouse click leaves focus on the trigger behind
    // the backdrop.
    if (dialog && !dialog.contains(document.activeElement)) {
      const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)

      const initialFocus = firstFocusable ?? dialog
      initialFocus.focus()
    }

    return () => previouslyFocused?.focus?.()
  }, [])

  // aria-modal claims the rest of the page is inert, so Tab has to be kept inside.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        requestClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current

      if (!dialog) {
        return
      }

      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]

      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [requestClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget
      }}
      onPointerUp={(event) => {
        // A click can report the overlay as the common ancestor of a press on the
        // backdrop and a release inside the dialog. Keep the release target too.
        if (event.target !== event.currentTarget) {
          pressStartedOnBackdrop.current = false
        }
      }}
      onPointerCancel={() => {
        pressStartedOnBackdrop.current = false
      }}
      onClick={(event) => {
        // Dismiss only when the press and release both happened on the backdrop.
        if (event.target === event.currentTarget && pressStartedOnBackdrop.current) {
          requestClose()
        }

        pressStartedOnBackdrop.current = false
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} rounded-lg bg-white p-6 shadow-xl outline-none`}
      >
        <h2 id={labelledBy} className="mb-1 text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="mb-5 text-sm text-slate-500">{description}</p>}
        {children}
      </div>
    </div>
  )
}
