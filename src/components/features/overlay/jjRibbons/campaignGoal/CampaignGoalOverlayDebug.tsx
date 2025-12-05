import { type Component, Show } from 'solid-js'
import { useCampaignGoalOverlay } from './CampaignGoalOverlayProvider.tsx'

export const CampaignGoalOverlayDebug: Component = () => {
  const {
    debug,
    raised,
    setRaised,
    goal,
    setGoal,
    previousGoal,
    setPreviousGoal,
  } = useCampaignGoalOverlay()

  return (
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
            <span class={'min-w-[64px] text-center tabular-nums text-white/90'}>
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
            <span class={'min-w-[64px] text-center tabular-nums text-white/90'}>
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
            <span class={'min-w-[64px] text-center tabular-nums text-white/90'}>
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
  )
}
