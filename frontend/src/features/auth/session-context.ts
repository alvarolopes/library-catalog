import { createContext, useContext } from 'react'
import type { Session } from '@/shared/api/types'

export interface SessionContextValue {
  session: Session | null
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)

  if (context === null) {
    throw new Error('useSession must be used within a SessionProvider.')
  }

  return context
}
