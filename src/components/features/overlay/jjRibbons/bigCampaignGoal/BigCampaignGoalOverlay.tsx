import { type Component, Show } from 'solid-js'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { twMerge } from 'tailwind-merge'
import type { BigCampaignGoalOverlayProps } from './BigCampaignGoalOverlayProps.ts'
import {
  CampaignGoalOverlayProvider,
  useCampaignGoalOverlay,
} from '../campaignGoal/CampaignGoalOverlayProvider.tsx'
import { CampaignGoalOverlayDebug } from '../campaignGoal/CampaignGoalOverlayDebug.tsx'

const Body: Component<{ barPosition: 'top' | 'bottom' }> = (props) => {
  const {
    currency,
    theme,
    showChangeLabel,
    showChange,
    changeAmount,
    raisedTween,
    goalTween,
    progressPct,
    goalReached,
  } = useCampaignGoalOverlay()

  const primaryBgClass = () =>
    theme() === 'blue'
      ? 'bg-accent-500'
      : theme() === 'black'
        ? 'bg-black'
        : 'bg-primary-500'

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
        ? 'bg-gray-500'
        : 'bg-primary'

  const mainRibbonColor = () => {
    if (theme() === 'blue') return '#3584BF'
    if (theme() === 'black') return '#313131'
    return '#E30E50'
  }

  const mainRibbonShadeColor = () => {
    if (theme() === 'blue') return '#09437a'
    if (theme() === 'black') return '#000000'
    return '#57051f'
  }

  const leftRibbonShape =
    'polygon(0 0, 100% 0, calc(100% - 15px) 20px, 100% 40px, 0 40px)'
  const rightRibbonShape = 'polygon(0 0, 100% 0, 100% 40px, 0 40px, 15px 20px)'

  const ProgressBar: Component = () => (
    <div class={twMerge(`h-3 w-full overflow-hidden rounded`, barClass())}>
      <div
        class={twMerge(
          `h-full ${barFullClass()} transition-all duration-700`,
          goalReached() && 'animate-pulse bg-yellow-400',
        )}
        style={{ width: `${progressPct()}%` }}
      />
    </div>
  )

  return (
    <div
      class={twMerge('flex w-full flex-col gap-3')}
      style={{
        '--main-ribbon-color': mainRibbonColor(),
        '--main-ribbon-shade-color': mainRibbonShadeColor(),
      }}
    >
      <Show when={props.barPosition === 'top'}>
        <ProgressBar />
      </Show>

      <div class="flex w-full flex-row justify-between gap-3">
        {/* Raised (left) */}
        <div class="relative flex h-[40px] min-w-[20%] items-center justify-center">
          <div
            class={twMerge(
              'flex h-full w-full items-center justify-center bg-[var(--main-ribbon-color)] font-bold text-white shadow-sm',
              primaryBgClass(),
            )}
            style={{ 'clip-path': leftRibbonShape }}
          >
            <p class={'w-full text-center text-2xl'}>
              <Numeric
                value={raisedTween()}
                currency={currency()}
                numberStyle="currency"
              />
            </p>
          </div>

          <Show when={showChangeLabel()}>
            <span
              class={twMerge(
                'pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 rounded-full bg-green-500 px-2 py-0.5 text-xxs font-bold text-white shadow-sm inline-flex items-center whitespace-nowrap gap-0.5',
              )}
              style="transition: opacity 300ms, transform 300ms; will-change: opacity, transform;"
              classList={{
                'opacity-100': showChange(),
                'opacity-0': !showChange(),
              }}
              aria-hidden={!showChange()}
            >
              +<Numeric
                value={changeAmount()}
                currency={currency()}
                numberStyle="currency"
              />
            </span>
          </Show>
        </div>

        {/* Goal (right) */}
        <div class="flex h-[40px] min-w-[20%] items-center justify-center">
          <div
            class={
              'flex h-full w-full items-center justify-center bg-white font-bold text-[var(--main-ribbon-color)]'
            }
            style={{ 'clip-path': rightRibbonShape }}
          >
            <p class={'w-full text-center text-xl'}>
              <Numeric
                value={goalTween()}
                currency={currency()}
                numberStyle="currency"
              />
            </p>
          </div>
        </div>
      </div>

      <Show when={props.barPosition === 'bottom'}>
        <ProgressBar />
      </Show>
      <CampaignGoalOverlayDebug/>
    </div>
  )
}

export const BigCampaignGoalOverlay: Component<BigCampaignGoalOverlayProps> = (
  props,
) => {
  const i18n = createI18n({ language: useLocale().locale() })

  // Map our props to the provider's expected props. Alignment is not used here.
  const providerProps = {
    user: props.user,
    theme: props.theme,
    currency: props.currency ?? 'GBP',
    debug: props.debug ?? false,
    showChangeLabel: props.showChangeLabel ?? false,
    alignment: 'left' as const,
  }

  const barPosition: 'top' | 'bottom' =
    props.alignment === 'top' ? 'top' : 'bottom'

  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <CampaignGoalOverlayProvider {...providerProps}>
          <Body barPosition={barPosition} />
        </CampaignGoalOverlayProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}
