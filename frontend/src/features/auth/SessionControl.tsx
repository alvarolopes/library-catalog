import { useState } from 'react'
import { LoginDialog } from './LoginDialog'
import { useSession } from './session-context'

/** The header's sign in / sign out control, plus the login dialog it opens. */
export function SessionControl() {
  const { session, isSignedIn, signOut } = useSession()
  const [isDialogOpen, setDialogOpen] = useState(false)

  if (isSignedIn && session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">
          {session.email}
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
            {session.role}
          </span>
        </span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Sign in
      </button>
      {isDialogOpen && <LoginDialog onClose={() => setDialogOpen(false)} />}
    </>
  )
}
