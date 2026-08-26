import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ListParams, PagedResult } from '@/shared/api/types'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Search box + paging, wired to a server-side list endpoint. Debounces typing so
 * a search does not fire a request per keystroke, and resets to page 1 when the
 * search changes — otherwise a narrower result set leaves the user on an empty page.
 */
export function useListQuery<T>(
  resource: string,
  fetcher: (params: ListParams) => Promise<PagedResult<T>>,
) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [requestedPage, setPage] = useState(1)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [search])

  // The API echoes the requested page even when a deletion made it out of range.
  // Once that response is cached, request its last valid page during render instead
  // of correcting state in an effect and showing an empty list for a frame.
  const requestedResult = queryClient.getQueryData<PagedResult<T>>([
    resource,
    { search: debouncedSearch, page: requestedPage },
  ])
  const page = requestedResult
    ? Math.min(requestedPage, Math.max(requestedResult.totalPages, 1))
    : requestedPage

  const query = useQuery({
    queryKey: [resource, { search: debouncedSearch, page }],
    queryFn: () => fetcher({ search: debouncedSearch || undefined, page }),
    // Keep the prior page during regular navigation, but never use an out-of-range
    // response as placeholder data while fetching its corrected page.
    placeholderData: page === requestedPage ? keepPreviousData : undefined,
  })

  return { search, setSearch, page, setPage, query }
}
