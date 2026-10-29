import { fetchGbpToEurRate } from '../../lib/external-apis/frankfurter.ts'

// Currency rate custodian: the USD conversion rate (received from the JJ API on
// refresh) and the GBP->EUR rate from Frankfurter (ECB reference rates).
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

  // GBP->EUR conversion via Frankfurter (throttled to once every 4h). A failed fetch keeps the
  // stored rate and throws, so the scheduler retries it with back-off (F-88).
  public async fetchGBPToEURConversionRate() {
    const rate = await this.storage.get<number>('gbp:eur:rate')
    const lastFetchedAt = await this.storage.get<number>(
      'gbp:eur:lastFetchedAt',
    )
    // 1 is what the old Google Finance scraper stored on every failure: treat it as missing
    const fresh =
      rate !== undefined &&
      rate !== 1 &&
      lastFetchedAt !== undefined &&
      Date.now() - lastFetchedAt <= 4 * 60 * 60 * 1000
    if (fresh) return
    const value = await fetchGbpToEurRate()
    await this.storage.put('gbp:eur:rate', value)
    await this.storage.put('gbp:eur:lastFetchedAt', Date.now())
  }
}
