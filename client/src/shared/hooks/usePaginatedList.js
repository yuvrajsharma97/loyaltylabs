import { useCallback, useEffect, useState } from 'react';

// Wraps any cursor-paginated fetchFn({limit, before, ...extraParams}) that
// returns {[itemsKey]: [...], nextCursor} - used by both the customer's and
// the store owner's transaction history screens.
export default function usePaginatedList(fetchFn, { itemsKey, limit = 20, params = {} } = {}) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsKey = JSON.stringify(params);

  const load = useCallback(
    async (before) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn({ limit, before, ...params });
        setItems((prev) => (before ? [...prev, ...result[itemsKey]] : result[itemsKey]));
        setCursor(result.nextCursor);
        setHasMore(Boolean(result.nextCursor));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchFn, itemsKey, limit, paramsKey]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const loadMore = () => {
    if (!loading && hasMore) load(cursor);
  };

  return { items, loading, hasMore, error, loadMore };
}
