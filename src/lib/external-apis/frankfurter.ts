// Frankfurter (https://frankfurter.dev): ECB reference exchange rates, no API key. Rates change
// once per working day, around 16:00 CET.

const LATEST_URL = 'https://api.frankfurter.dev/v1/latest'

type LatestResponse = {
  base: string
  date: string
  rates: Record<string, number>
}

/** The latest GBP->EUR rate. Throws when the request fails or the answer has no usable rate. */
export async function fetchGbpToEurRate(): Promise<number> {
  const res = await fetch(`${LATEST_URL}?base=GBP&symbols=EUR`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Frankfurter GBP->EUR: ${res.status} ${res.statusText}`)
  }
  const body = (await res.json()) as Partial<LatestResponse>
  const rate = body.rates?.EUR
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Frankfurter GBP->EUR: no EUR rate in the answer (${body.date ?? 'no date'})`)
  }
  return rate
}
