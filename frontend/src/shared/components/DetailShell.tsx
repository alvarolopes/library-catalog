import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'

interface DetailShellProps {
  title: string
  /** Where the "back" link goes, so a deep-linked page is never a dead end. */
  backTo: { to: string; label: string }
  isLoading: boolean
  error: unknown
  children: ReactNode
}

/**
 * The states a detail page has to get right — loading, gone, failed, loaded.
 *
 * "Gone" is separate from "failed" on purpose: following a stale link to a record
 * someone else deleted is ordinary, and telling the user that is more useful than
 * a generic error.
 */
export function DetailShell({ title, backTo, isLoading, error, children }: DetailShellProps) {
  const isMissing = error instanceof ApiError && error.status === 404

  return (
    <section>
      <Link
        to={backTo.to}
        className="mb-4 inline-block text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        &larr; {backTo.label}
      </Link>

      {isLoading && <Message>Loading...</Message>}

      {!isLoading && isMissing && (
        <Message tone="error">
          This record no longer exists — it may have been deleted.
        </Message>
      )}

      {!isLoading && error != null && !isMissing && (
        <Message tone="error">
          {error instanceof ApiError ? error.message : 'Something went wrong loading this record.'}
        </Message>
      )}

      {!isLoading && error == null && (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
          {children}
        </>
      )}
    </section>
  )
}

function Message({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'error' }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={`rounded-md border px-4 py-8 text-center text-sm ${
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {children}
    </p>
  )
}

/** Field/value pairs for the record's own attributes. */
export function DetailFields({ children }: { children: ReactNode }) {
  return (
    <dl className="mb-8 grid gap-x-8 gap-y-4 rounded-md border border-slate-200 bg-white p-6 sm:grid-cols-2">
      {children}
    </dl>
  )
}

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

/** Heading for the list of records that depend on the one being viewed. */
export function RelatedSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}
