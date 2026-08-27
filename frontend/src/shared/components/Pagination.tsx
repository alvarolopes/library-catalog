import { Button } from '@/shared/components/Button'
import type { ReactNode } from 'react'

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
