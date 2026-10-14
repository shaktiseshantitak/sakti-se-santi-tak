/**
 * Resolve an optional Control-Panel text with a built-in default.
 *  - unset / empty  -> the default (the site looks exactly as before)
 *  - a single space -> '' (the admin deliberately hides that piece of text)
 */
export const siteText = (value: string | undefined | null, fallback: string): string =>
  !value ? fallback : value.trim();
