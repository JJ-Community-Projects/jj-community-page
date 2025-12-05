import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  on,
  onCleanup,
  type ParentComponent,
  useContext,
} from 'solid-js'
import type { CampaignGoalOverlayProps } from './CampaignGoalOverlayProps.ts'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
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
const useCampaignGoalOverlayHook = (props: CampaignGoalOverlayProps) => {

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

  const alignment = () => props.alignment ?? 'right'

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


  return {
    alignment, currency, theme,debug, showChangeLabel,
    showChange, changeAmount,
    raisedTween,
    goalTween,
    progressPct,
    goalReached,
    raised, setRaised,
    goal, setGoal,
    previousGoal, setPreviousGoal,
  }

}


const CampaignGoalOverlayContext = createContext<ReturnType<typeof useCampaignGoalOverlayHook>>()

export const CampaignGoalOverlayProvider: ParentComponent<CampaignGoalOverlayProps> = (props) => {
  const hook = useCampaignGoalOverlayHook(props)
  return (
    <CampaignGoalOverlayContext.Provider value={hook}>
      {props.children}
    </CampaignGoalOverlayContext.Provider>
  )
}
export const useCampaignGoalOverlay = () => useContext(CampaignGoalOverlayContext)!
