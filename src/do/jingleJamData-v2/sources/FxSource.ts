// GBP -> EUR rate, scraped from Google Finance.
//
// Unlike the v1 CurrencyStore, this returns `null` on any failure (never `1`)
// and validates the parsed rate is within a sane band, so a scrape glitch can't
// silently zero out conversions — the caller keeps the last-good rate instead.

const DEFAULT_TIMEOUT_MS = 15_000
const MIN_RATE = 0.5
const MAX_RATE = 2

export class FxSource {
  constructor(private timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async fetchGbpToEur(): Promise<number | null> {
    try {
      const res = await fetch(
        'https://www.google.com/finance/quote/GBP-EUR',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      )
      if (!res.ok) return null
      const html = await res.text()
      const match = html.match(
        /<[^>]*class="[^"]*\bYMlKec\b[^"]*\bfxKbKc\b[^"]*"[^>]*>([^<]+)<\/[^>]*>/i,
      )
      if (!match) return null
      const numericText = match[1]
        .trim()
        .replace(/[^0-9.,-]/g, '')
        .replace(/,/g, '')
      const value = parseFloat(numericText)
      if (!Number.isFinite(value)) return null
      if (value <= MIN_RATE || value >= MAX_RATE) return null
      return value
    } catch (e) {
      console.error('FxSource.fetchGbpToEur', e)
      return null
    }
  }
}
