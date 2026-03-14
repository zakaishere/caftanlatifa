import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media queries.
 * Safe for SSR (defaults to false on server, instantly sets on client).
 */
export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    // Determine the current match immediately on mount
    const mql = window.matchMedia(query);
    setValue(mql.matches);

    // Listen for changes
    const onChange = (e: MediaQueryListEvent) => {
      setValue(e.matches);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return value;
}
