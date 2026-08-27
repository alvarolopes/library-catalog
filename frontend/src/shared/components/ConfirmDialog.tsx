import { Dialog } from './Dialog'
import { Button } from '@/shared/components/Button'
import { Alert } from '@/shared/components/Feedback'

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
        <Alert className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button
          onClick={onCancel}
            tone="ghost"
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={onConfirm}
          tone="danger"
        >
          {isSubmitting ? 'Deleting...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
