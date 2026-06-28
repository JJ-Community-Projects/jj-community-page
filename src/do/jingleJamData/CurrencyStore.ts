// Currency rate custodian: the USD conversion rate (received from the JJ API on
// refresh) and the GBP->EUR rate scraped from Google Finance.
//
// Owns storage keys: `dollarConversionRate`, `gbp:eur:rate`, `gbp:eur:lastFetchedAt`.
export class CurrencyStore {
  constructor(private storage: DurableObjectStorage) {}

  public async getDollarConversionRate() {
    const dollarConversionRate = await this.storage.get<number>(
      'dollarConversionRate',
    )
    return dollarConversionRate ?? 1
  }

  public async setDollarConversionRate(rate: number) {
    await this.storage.put('dollarConversionRate', rate)
  }

  // Returns the cached GBP->EUR rate or 1 if not available
  public async getGbpToEurRate() {
    const rate = await this.storage.get<number>('gbp:eur:rate')
    return rate ?? 1
  }

  // GBP->EUR conversion via Google Finance (throttled to once every 4h)
  public async fetchGBPToEURConversionRate() {
    const lastFetchedAt = await this.storage.get<number>(
      'gbp:eur:lastFetchedAt',
    )
    if (!lastFetchedAt || Date.now() - lastFetchedAt > 4 * 60 * 60 * 1000) {
      const value = await this.fetchFromRateAPI()
      if (Number.isFinite(value)) {
        await this.storage.put('gbp:eur:rate', value)
        await this.storage.put('gbp:eur:lastFetchedAt', Date.now())
      }
    }
  }

  private async fetchFromRateAPI() {
    try {
      const url = 'https://www.google.com/finance/quote/GBP-EUR'
      const res = await fetch(url, {
        headers: {
          // Some sites return different content for bots; set a common UA
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
      if (!res.ok) {
        throw new Error(
          `Failed to fetch GBP->EUR page: ${res.status} ${res.statusText}`,
        )
      }
      const html = await res.text()

      // Look for an element that contains both classes "YMlKec" and "fxKbKc"
      const match = html.match(
        /<[^>]*class=\"[^\"]*\bYMlKec\b[^\"]*\bfxKbKc\b[^\"]*\"[^>]*>([^<]+)<\/[^>]*>/i,
      )
      if (!match) {
        throw new Error('GBP->EUR conversion rate element not found')
      }
      const rawText = match[1].trim()
      const numericText = rawText.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
      const value = parseFloat(numericText)
      if (!Number.isFinite(value)) {
        throw new Error(
          `Unable to parse GBP->EUR conversion rate from text: "${rawText}"`,
        )
      }
      return value
    } catch (e) {
      console.error(e)
      return 1
    }
  }
}
