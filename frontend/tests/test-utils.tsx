import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SessionProvider } from '@/features/auth/session'

/**
 * A fresh client per test: a shared one would carry cached responses across tests
 * and turn ordering into a hidden dependency. Retries are off so a deliberate
 * error response fails immediately instead of after three attempts.
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

// oxlint-disable-next-line react/only-export-components -- a test wrapper, never fast-refreshed
function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <SessionProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </SessionProvider>
    </QueryClientProvider>
  )
}

export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup()

  return { ...render(ui, { wrapper: Providers }), user }
}
