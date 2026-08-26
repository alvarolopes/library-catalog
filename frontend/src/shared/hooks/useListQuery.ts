import { keepPreviousData, useQuery } from '@tanstack/react-query'
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
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [search])

  const query = useQuery({
    queryKey: [resource, { search: debouncedSearch, page }],
    queryFn: () => fetcher({ search: debouncedSearch || undefined, page }),
    // Keeps the current page visible while the next one loads, instead of
    // flashing the loading state on every page change.
    placeholderData: keepPreviousData,
  })

  // A deletion can shrink the server-side result set under the current page, leaving
  // the user on a page that no longer exists.
  //
  // Only settled data may drive this. A cache entry for a page can be left holding a
  // smaller totalPages from before the list grew again — invalidateQueries refetches
  // active queries only, so an unobserved page keeps its stale value. React Query
  // serves that entry the instant the page is requested and refetches behind it, so
  // clamping on it would bounce straight back and un-observe the page before the
  // refetch could correct it, stranding the user one page short for good.
  const totalPages = query.data?.totalPages
  const hasSettledData = !query.isFetching && !query.isPlaceholderData

  useEffect(() => {
    if (hasSettledData && totalPages !== undefined && page > Math.max(totalPages, 1)) {
      // This synchronizes an asynchronous server-provided bound, not derived UI state.
      // oxlint-disable-next-line react/set-state-in-effect
      setPage(Math.max(totalPages, 1))
    }
  }, [page, totalPages, hasSettledData])

  return { search, setSearch, page, setPage, query }
}
