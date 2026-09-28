import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delayMs` - used by
// search boxes so each keystroke doesn't fire a request.
export function useDebouncedValue(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}
