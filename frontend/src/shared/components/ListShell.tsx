import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/components/Button'
import { TextInput } from '@/shared/components/FormControls'

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

      {isLoading && <Message>Loading...</Message>}

      {error != null && (
        <Message tone="error">
          {error instanceof ApiError ? error.message : 'Something went wrong loading this list.'}
        </Message>
      )}

      {!isLoading && error == null && isEmpty && <Message>{emptyMessage}</Message>}

      {!isLoading && error == null && !isEmpty && children}
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

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        Page {page} of {Math.max(totalPages, 1)} — {totalItems} total
      </span>
      <div className="flex gap-2">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </PageButton>
        <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      tone="outline"
      size="sm"
    >
      {children}
    </Button>
  )
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}
