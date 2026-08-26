import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '@/shared/components/Dialog'

/**
 * Two of these pin bugs that reached review: a dialog that closed when the user
 * drag-selected text out of it, discarding the form, and a confirmation dialog
 * that never took focus because the guard checked for document.body while a real
 * mouse click had focused the trigger button.
 */
describe('Dialog', () => {
  function open(onClose = vi.fn(), isBusy = false) {
    render(
      <Dialog title="Delete genre" labelledBy="dialog-title" onClose={onClose} isBusy={isBusy}>
        <input aria-label="Notes" />
        <button type="button">Cancel</button>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')

    return { dialog, backdrop: dialog.parentElement as HTMLElement, onClose }
  }

  it('closes when the backdrop is both pressed and released', () => {
    const { backdrop, onClose } = open()

    fireEvent.pointerDown(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('stays open when a drag starts inside and ends on the backdrop', () => {
    const { dialog, backdrop, onClose } = open()

    // A click reports the common ancestor of press and release, so this arrives as
    // a click on the backdrop even though the user was selecting text in the form.
    fireEvent.pointerDown(dialog)
    fireEvent.pointerUp(backdrop)
    fireEvent.click(backdrop)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('stays open when a drag starts on the backdrop and ends inside', () => {
    const { dialog, backdrop, onClose } = open()

    fireEvent.pointerDown(backdrop)
    fireEvent.pointerUp(dialog)
    fireEvent.click(backdrop)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('moves focus inside on open even when nothing autofocuses', async () => {
    const { dialog } = open()

    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = open()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores Escape and the backdrop while a request is in flight', async () => {
    const user = userEvent.setup()
    const { backdrop, onClose } = open(vi.fn(), true)

    await user.keyboard('{Escape}')
    fireEvent.pointerDown(backdrop)
    fireEvent.click(backdrop)

    // Closing mid-request would unmount the dialog before its outcome is known,
    // so a refused delete would resolve into a component nobody can see.
    expect(onClose).not.toHaveBeenCalled()
  })

  it('returns focus to whatever was focused before it opened', async () => {
    function Harness() {
      const [isOpen, setOpen] = useState(false)

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {isOpen && (
            <Dialog title="Delete genre" labelledBy="dialog-title" onClose={() => setOpen(false)}>
              <button type="button">Cancel</button>
            </Dialog>
          )}
        </>
      )
    }

    const user = userEvent.setup()
    render(<Harness />)

    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')

    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
