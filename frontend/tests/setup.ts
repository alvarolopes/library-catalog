import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetCatalog } from './msw/catalog'
import { server } from './msw/server'

// Requests are intercepted at the network boundary rather than by stubbing the API
// module, so the HTTP client, the ApiError construction and the problem-response
// parsing all stay under test — which is where several real bugs have lived.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  resetCatalog()
  sessionStorage.clear()
})

afterAll(() => server.close())
