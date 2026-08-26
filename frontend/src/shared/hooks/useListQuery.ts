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

  // Deleting the last row of the last page shrinks the result set under the user.
  // Without this they are left on a page that no longer exists, reading "no records"
  // while the list is in fact full.
  const totalPages = query.data?.totalPages

  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  return { search, setSearch, page, setPage, query }
}
