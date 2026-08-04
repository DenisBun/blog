/**
 * Serialize data for embedding as raw text inside a script element.
 * Escaping HTML-significant characters prevents a value from closing the
 * script element while keeping the payload valid JSON.
 */
export const toSafeJsonScript = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
