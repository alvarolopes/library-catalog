import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { TextInput } from '@/shared/components/FormControls'
import { StatusMessage } from '@/shared/components/StatusMessage'

interface ListShellProps {
  title: string
  search: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: ReactNode
  actions?: ReactNode
  /**
   * A list nested inside a detail page sits under that page's own heading, so it
   * must not emit a second `h1`. Defaults to the top level for the standalone pages.
   */
  headingLevel?: 1 | 2
  /** Replaces the default "No records match this view." for a nested list. */
  emptyMessage?: string
}

/**
 * The four states every list has to get right — loading, error, empty, populated —
 * in one place, so no screen quietly forgets one of them.
 */
export function ListShell({
  title,
  search,
  onSearchChange,
  isLoading,
  error,
  isEmpty,
  children,
  actions,
  headingLevel = 1,
  emptyMessage = 'No records match this view.',
}: ListShellProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Heading
          className={
            headingLevel === 1
              ? 'text-2xl font-semibold tracking-tight'
              : 'text-lg font-semibold tracking-tight'
          }
        >
          {title}
        </Heading>
        {actions}
      </div>

      <TextInput
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={`Search ${title.toLowerCase()}...`}
        aria-label={`Search ${title.toLowerCase()}`}
        className="mb-4 max-w-sm"
      />

      {isLoading && <StatusMessage>Loading...</StatusMessage>}

      {error != null && (
        <StatusMessage tone="error">
          {error instanceof ApiError ? error.message : 'Something went wrong loading this list.'}
        </StatusMessage>
      )}

      {!isLoading && error == null && isEmpty && <StatusMessage>{emptyMessage}</StatusMessage>}

      {!isLoading && error == null && !isEmpty && children}
    </section>
  )
}
