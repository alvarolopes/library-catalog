import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface DialogProps {
  title: string
  description?: string
  labelledBy: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
}

export function Dialog({
  title,
  description,
  labelledBy,
  onClose,
  children,
  maxWidthClassName = 'max-w-sm',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (document.activeElement === document.body) {
      dialogRef.current?.focus()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} rounded-lg bg-white p-6 shadow-xl outline-none`}
        onClick={(event) => event.stopPropagation()}
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
