import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  on,
  onCleanup,
  Show,
} from 'solid-js'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../lib/orpc/client.ts'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { twMerge } from 'tailwind-merge'

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function createTweenedNumber(
  source: Accessor<number>,
  opts?: { duration?: number; easing?: (t: number) => number },
) {
  const duration = opts?.duration ?? 700
  const easing = opts?.easing ?? easeOutCubic

  const [value, setValue] = createSignal(source())
  let raf = 0

  createEffect(() => {
    const from = value()
    const to = source()
    if (from === to) return

    cancelAnimationFrame(raf)
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const k = easing(t)
      setValue(from + (to - from) * k)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
  })

  onCleanup(() => cancelAnimationFrame(raf))
  return value
}

interface CampaignGoalOverlayProps {
  user?: string
  theme: string
  currency?: 'GBP' | 'USD' | 'EUR'
  debug?: boolean
  showChangeLabel?: boolean
}

const Body: Component<CampaignGoalOverlayProps> = (props) => {
  const theme = () => {
    if (props.theme === 'blue') return 'blue'
    if (props.theme === 'red') return 'red'
    if (props.theme === 'black') return 'black'

    return 'red'
  }

  const currency = () => {
    if (props.currency === 'GBP') return 'GBP'
    if (props.currency === 'USD') return 'USD'
    if (props.currency === 'EUR') return 'EUR'
    return 'GBP'
  }

  const debug = () => props.debug ?? false

  const showChangeLabel = () => props.showChangeLabel ?? false

  const goalQuery = useQuery(() =>
    orpcPrivate.overlay.campaignGoalSlug.queryOptions({
      input: {
        tiltifySlug: props.user ?? '',
        currency: props.currency ?? 'GBP',
      },
      staleTime: 10_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      enabled: !debug(),
      placeholderData: (prev) => prev,
    }),
  )

  const [raised, setRaised] = createSignal<number>(0)
  const [goal, setGoal] = createSignal<number>(0)
  const [previousGoal, setPreviousGoal] = createSignal<number>(0)
  // New: tweened values for display
  const raisedTween = createTweenedNumber(raised, { duration: 300 })
  const goalTween = createTweenedNumber(goal, { duration: 300 })

  createEffect(
    on(
      () => goalQuery.data,
      (data) => {
        if (!debug()) {
          setRaised(data?.raised ?? 0)
          setGoal(data?.goal ?? 0)
          setPreviousGoal(data?.previousGoal ?? 0)
        }
      },
    ),
  )

  // Tracks the last positive increase and label visibility
  const [changeAmount, setChangeAmount] = createSignal<number>(0)
  const [showChange, setShowChange] = createSignal(false)
  let hideTimer: number | undefined

  // When raised changes, show a temporary label if it increased
  createEffect(
    on(raised, (val, prev) => {
      const from = prev ?? val
      const delta = val - from

      // Only show for increases
      if (delta > 0) {
        // Accumulate if a new increase arrives before the timer hides
        setChangeAmount((prevAmt) => (showChange() ? prevAmt + delta : delta))
        setShowChange(true)

        // Reset the 4s hide timer
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => {
          setShowChange(false)
          setChangeAmount(0)
        }, 3000)
      } else if (delta < 0) {
        // Optional: hide on decreases; comment out if you prefer to keep the label
        if (hideTimer) clearTimeout(hideTimer)
        setShowChange(false)
        setChangeAmount(0)
      }
    }),
  )

  onCleanup(() => {
    if (hideTimer) clearTimeout(hideTimer)
  })

  const primaryBgClass = () =>
    theme() === 'blue'
      ? 'bg-accent-500'
      : theme() === 'black'
        ? 'bg-black'
        : 'bg-primary-500'

  const primaryTextClass = () =>
    theme() === 'blue'
      ? 'text-accent-500'
      : theme() === 'black'
        ? 'text-black'
        : 'text-primary-500'

  const barClass = () =>
    theme() === 'blue'
      ? 'bg-accent-700'
      : theme() === 'black'
        ? 'bg-black'
        : 'bg-primary-700'

  const barFullClass = () =>
    theme() === 'blue'
      ? 'bg-accent'
      : theme() === 'black'
        ? 'bg-gray'
        : 'bg-primary'

  const progressPct = () => {
    const prev = previousGoal()
    const target = goal()
    const r = raised()
    if (target <= prev) {
      return r >= target ? 100 : 0
    }
    const ratio = (r - prev) / (target - prev)
    return Math.max(0, Math.min(1, ratio)) * 100
  }

  const goalReached = () => raised() >= goal() && raised() > 0 && goal() > 0

  return (
    <div class="flex w-full flex-col items-end gap-2">
      <div
        class={`relative flex h-[40px] w-full items-center justify-center ${primaryBgClass()} font-bold text-white`}
        style={{
          'clip-path': 'polygon(0 0, 100% 0, 100% 40px, 0 40px, 15px 20px)',
        }}
      >
        <p class={'w-full text-center text-2xl'}>
          <Numeric
            value={raisedTween()}
            currency={currency()}
            numberStyle="currency"
          />
        </p>

        <Show when={showChangeLabel()}>
          <span
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-green-500 px-2 py-0.5 text-xxs font-bold text-white shadow-sm"
            style="transition: opacity 300ms, transform 300ms; will-change: opacity, transform;"
            classList={{
              'opacity-100': showChange(),
              'opacity-0': !showChange(),
            }}
            aria-hidden={!showChange()}
          >
            +
            <Numeric
              value={changeAmount()}
              currency={currency()}
              numberStyle="currency"
            />
          </span>
        </Show>
      </div>

      <div class="flex w-[70%] flex-col items-end">
        <div
          class={`flex h-[40px] w-full items-center justify-center bg-white font-bold ${primaryTextClass()}`}
          style={{
            'clip-path': 'polygon(0 0, 100% 0, 100% 40px, 0 40px, 15px 20px)',
          }}
        >
          <p class={'text-xl'}>
            <Numeric
              value={goalTween()}
              currency={currency()}
              numberStyle="currency"
            />
          </p>
        </div>
        <div class={`h-3 w-full overflow-hidden rounded ${barClass()}`}>
          <div
            class={twMerge(
              `h-full ${barFullClass()} transition-all duration-700`,
              goalReached() && 'animate-pulse bg-yellow-400',
            )}
            style={{ width: `${progressPct()}%` }}
          />
        </div>
      </div>

      <Show when={debug()}>
        {/* Compact debug panel: low visual weight, unobtrusive, easy to use */}
        <div
          class={
            'pointer-events-auto absolute bottom-2 left-2 z-50 flex min-w-[220px] flex-col gap-1 rounded-md border border-white/10 bg-black/60 p-2 text-[11px] text-white/80 shadow-md backdrop-blur'
          }
        >
          <p class={'mb-1 text-[10px] text-white/60'}>
            Debug controls (overlay preview)
          </p>

          {/* Raised */}
          <div class={'flex items-center justify-between gap-2'}>
            <span class={'shrink-0'}>Raised</span>
            <div class={'ml-auto flex items-center gap-1'}>
              <button
                aria-label="Decrease raised"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setRaised(raised() - 10)}
              >
                −
              </button>
              <span
                class={'min-w-[64px] text-center tabular-nums text-white/90'}
              >
                {raised()}
              </span>
              <button
                aria-label="Increase raised"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setRaised(raised() + 10)}
              >
                +
              </button>
            </div>
          </div>

          {/* Goal */}
          <div class={'flex items-center justify-between gap-2'}>
            <span class={'shrink-0'}>Goal</span>
            <div class={'ml-auto flex items-center gap-1'}>
              <button
                aria-label="Decrease goal"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setGoal(goal() - 100)}
              >
                −
              </button>
              <span
                class={'min-w-[64px] text-center tabular-nums text-white/90'}
              >
                {goal()}
              </span>
              <button
                aria-label="Increase goal"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setGoal(goal() + 100)}
              >
                +
              </button>
            </div>
          </div>

          {/* Previous Goal */}
          <div class={'flex items-center justify-between gap-2'}>
            <span class={'shrink-0'}>Prev goal</span>
            <div class={'ml-auto flex items-center gap-1'}>
              <button
                aria-label="Decrease previous goal"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setPreviousGoal(previousGoal() - 100)}
              >
                −
              </button>
              <span
                class={'min-w-[64px] text-center tabular-nums text-white/90'}
              >
                {previousGoal()}
              </span>
              <button
                aria-label="Increase previous goal"
                class={
                  'h-6 w-6 rounded-sm border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                }
                onClick={() => setPreviousGoal(previousGoal() + 100)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export const CampaignGoalOverlay: Component<CampaignGoalOverlayProps> = (
  props,
) => {
  const i18n = createI18n({ language: useLocale().locale() })
  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <Body {...props} />
      </QueryClientProvider>
    </I18nProvider>
  )
}
