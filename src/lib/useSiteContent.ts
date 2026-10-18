import { useCallback, useMemo } from 'react';
import { useBooks } from '../context/BookContext';
import { cleanContentMap, resolveContent } from '../utils/siteContent';

/** c('trust.title') -> Control-Panel text, or the built-in default. */
export function useSiteContent(): (key: string) => string {
  const { siteSettings } = useBooks();
  const map = useMemo(() => cleanContentMap(siteSettings?.contentText), [siteSettings?.contentText]);
  return useCallback((key: string) => resolveContent(map, key), [map]);
}

/** The GST % the cart really charges (same rule as CartContext), so labels never show a made-up rate. */
export function useTaxPercent(): number {
  const { siteSettings } = useBooks();
  return siteSettings?.taxPercentage || 5;
}
