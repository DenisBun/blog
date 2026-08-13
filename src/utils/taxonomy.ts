export function slugifyTaxonomy(value: string): string {
  return value
    .normalize('NFKD')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
