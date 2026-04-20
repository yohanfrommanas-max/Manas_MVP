/** Replace em dashes and en dashes with a space so no dash characters appear in rendered text. */
export function sanitizeDashes(text: string): string {
  return text
    .replace(/\u2014/g, ' ')
    .replace(/\u2013/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
