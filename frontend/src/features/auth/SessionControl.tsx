import { useState } from 'react'
import { LoginDialog } from './LoginDialog'
import { useSession } from './session-context'
import { Button } from '@/shared/components/Button'

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
        <Button
          onClick={signOut}
          tone="outline"
          size="sm"
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
            size="sm"
      >
        Sign in
      </Button>
      {isDialogOpen && <LoginDialog onClose={() => setDialogOpen(false)} />}
    </>
  )
}
