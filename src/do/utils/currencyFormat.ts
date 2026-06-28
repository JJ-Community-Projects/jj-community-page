import type { CurrenciesTV } from '../../lib/orpc/public/twitchExtension/contract.ts'

// Converts a GBP amount into the multi-currency TV shape using the provided
// USD and EUR rates. Pure helper shared by the display builders.
export function toCurrencies(
  gbp: number,
  usdRateIn: number,
  eurRateIn: number,
): CurrenciesTV {
  const usd = Math.round(gbp * usdRateIn * 100) / 100
  const euro = Math.round(gbp * eurRateIn * 100) / 100
  return {
    gbp,
    usd,
    euro,
    gbpFormatted: new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(gbp),
    usdFormatted: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usd),
    euroFormatted: new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(euro),
  }
}
