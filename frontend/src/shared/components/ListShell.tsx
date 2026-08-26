import type { ReactNode } from 'react'
import { ApiError } from '@/shared/api/client'

interface ListShellProps {
  title: string
  search: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: ReactNode
  actions?: ReactNode
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
}: ListShellProps) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions}
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={`Search ${title.toLowerCase()}...`}
        aria-label={`Search ${title.toLowerCase()}`}
        className="mb-4 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
      />

      {isLoading && <Message>Loading...</Message>}

      {error != null && (
        <Message tone="error">
          {error instanceof ApiError ? error.message : 'Something went wrong loading this list.'}
        </Message>
      )}

      {!isLoading && error == null && isEmpty && (
        <Message>No records match this view.</Message>
      )}

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
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-slate-100"
    >
      {children}
    </button>
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
