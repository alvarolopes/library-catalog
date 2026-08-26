import type { ProblemDetails } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/**
 * Carries the parsed problem response so callers can react to *why* a request
 * failed — mapping field errors back onto a form, or explaining a blocked delete —
 * instead of showing one generic message for every failure.
 */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail ?? problem?.title ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  /** Field-level validation errors from a 400, keyed by property name. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {}
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403
  }
}

let authToken: string | null = null

/** Held in memory only — a token in localStorage is readable by any injected script. */
export function setAuthToken(token: string | null): void {
  authToken = token
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${BASE_URL}${path}`)

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

async function request<T>(
  method: string,
  path: string,
  options: { params?: Record<string, unknown>; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    // A failure without a parseable body is still a failure — never let the
    // parse error mask the original status.
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status, problem)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>('GET', path, { params }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
