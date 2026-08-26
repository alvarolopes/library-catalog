import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setAuthToken } from '@/shared/api/client'
import { authApi } from '@/shared/api/resources'
import type { Session } from '@/shared/api/types'

interface SessionContextValue {
  session: Session | null
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const STORAGE_KEY = 'library-catalog.session'

/**
 * Reads a session that survived a page reload, discarding anything expired or
 * unparseable. Storage access itself can throw — private browsing, blocked site
 * data — and a missing session is not an error, so failures degrade to signed out.
 */
function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const stored = JSON.parse(raw) as Session

    return new Date(stored.expiresAt).getTime() > Date.now() ? stored : null
  } catch {
    return null
  }
}

/**
 * Holds the bearer token in sessionStorage: it survives a reload but not closing
 * the tab.
 *
 * Keeping it in memory instead is often called the secure option, but it does not
 * actually stop the attack it claims to — a script injected into the page can hook
 * fetch or read component state just as easily as it can read storage. It only
 * costs the user their session on every reload. The real mitigation is an httpOnly
 * cookie with a refresh-token flow, which is listed under future work.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const restored = readStoredSession()

    if (restored) {
      setAuthToken(restored.token)
    }

    return restored
  })

  const signOut = useCallback(() => {
    setSession(null)
    setAuthToken(null)

    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to recover from: the in-memory session is already cleared.
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await authApi.login({ email, password })

    setSession(next)
    setAuthToken(next.token)

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage being unavailable costs persistence across reloads, not the session.
    }
  }, [])

  // Sign out the moment the token expires, rather than letting the user work in
  // a signed-in-looking UI whose every write comes back 401.
  useEffect(() => {
    if (!session) {
      return
    }

    const msUntilExpiry = new Date(session.expiresAt).getTime() - Date.now()

    if (msUntilExpiry <= 0) {
      signOut()
      return
    }

    const timer = setTimeout(signOut, msUntilExpiry)

    return () => clearTimeout(timer)
  }, [session, signOut])

  const value = useMemo<SessionContextValue>(
    () => ({ session, isSignedIn: session !== null, signIn, signOut }),
    [session, signIn, signOut],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)

  if (context === null) {
    throw new Error('useSession must be used within a SessionProvider.')
  }

  return context
}
