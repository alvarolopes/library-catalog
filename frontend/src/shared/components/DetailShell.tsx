import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { StatusMessage } from '@/shared/components/StatusMessage'
import { TextLink } from '@/shared/components/TextLink'

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
      <TextLink
        to={backTo.to}
        className="mb-4 inline-block text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        &larr; {backTo.label}
      </TextLink>

      {isLoading && <StatusMessage>Loading...</StatusMessage>}

      {!isLoading && isMissing && (
        <StatusMessage tone="error">
          This record no longer exists — it may have been deleted.
        </StatusMessage>
      )}

      {!isLoading && error != null && !isMissing && (
        <StatusMessage tone="error">
          {error instanceof ApiError ? error.message : 'Something went wrong loading this record.'}
        </StatusMessage>
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
