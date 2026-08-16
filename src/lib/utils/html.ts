/**
 * Hapus tag HTML dari teks hasil scraping/import sistem sumber.
 * ponytail: bukan parser HTML penuh — cukup untuk membuang markup/widget lama
 * (mis. tombol dengan onClick dari sistem sumber yang tidak berfungsi di app ini).
 * Jalur upgrade: DOMPurify (allowlist) jika suatu saat perlu mempertahankan format.
 */
export function stripHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
