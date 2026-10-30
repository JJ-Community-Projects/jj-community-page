import { type Component, createSignal, onMount } from 'solid-js'
import { useLocale } from '@kobalte/core'
import type { Currencies } from '../../../lib/orpc/private/jjData/contract.ts'

export type Currency = 'GBP' | 'USD' | 'EUR'

export const raisedIn = (
  raised: Currencies | null | undefined,
  currency: Currency,
) =>
  currency === 'USD'
    ? (raised?.usd ?? 0)
    : currency === 'EUR'
      ? (raised?.euro ?? 0)
      : (raised?.gbp ?? 0)

/**
 * A currency amount. Server-rendered as en-US (solid-i18n's Numeric is client-only and /community/ssr
 * renders this on the server), then switched to the viewer's locale once mounted.
 */
export const Money: Component<{ value: number; currency: Currency }> = (
  props,
) => {
  const locale = useLocale()
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const text = () =>
    new Intl.NumberFormat(mounted() ? locale.locale() : 'en-US', {
      style: 'currency',
      currency: props.currency,
    }).format(props.value)
  return <>{text()}</>
}
