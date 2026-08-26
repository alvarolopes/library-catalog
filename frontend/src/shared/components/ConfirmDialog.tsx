import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  isSubmitting: boolean
  error?: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      description={description}
      labelledBy="confirm-dialog-title"
      onClose={onCancel}
      isBusy={isSubmitting}
    >
      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
