import { useCallback, useEffect, useState } from 'react';

// Page-number pagination shared by every list screen. fetchPage(page) must
// resolve to { items, pagination } where pagination is the API's
// { page, limit, total, totalPages, hasNextPage, hasPrevPage }.
//
// Pass a fetchPage wrapped in useCallback: when its identity changes (a
// filter or search changed) the list jumps back to page 1.
export function usePaginatedList(fetchPage) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Reset to page 1 when the filters change - adjusted during render (React's
  // documented pattern) so the stale page is never fetched with new filters.
  const [prevFetchPage, setPrevFetchPage] = useState(() => fetchPage);
  if (prevFetchPage !== fetchPage) {
    setPrevFetchPage(() => fetchPage);
    setPage(1);
  }

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPage(page)
      .then((result) => {
        if (isCancelled) return;
        // The last item on the last page was removed (e.g. a delete) - step back a page.
        if (result.items.length === 0 && page > 1 && page > result.pagination.totalPages) {
          setPage(result.pagination.totalPages);
          return;
        }
        setItems(result.items);
        setPagination(result.pagination);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        setError(err.message || 'Unable to load. Please try again.');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [fetchPage, page, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { items, pagination, page, setPage, isLoading, error, reload };
}
