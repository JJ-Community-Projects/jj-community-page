import { type Component, Show } from 'solid-js'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '@tanstack/solid-query'
import { createI18n, I18nProvider, Numeric } from 'solid-i18n'
import { useLocale } from '@kobalte/core'
import { twMerge } from 'tailwind-merge'
import type { CampaignGoalOverlayProps } from './CampaignGoalOverlayProps.ts'
import {
  CampaignGoalOverlayProvider,
  useCampaignGoalOverlay,
} from './CampaignGoalOverlayProvider.tsx'
import { CampaignGoalOverlayDebug } from './CampaignGoalOverlayDebug.tsx'

const Body: Component = () => {
  const {
    alignment,
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

  const rightRibbonShape = 'polygon(0 0, 100% 0, 100% 40px, 0 40px, 15px 20px)'
  const leftRibbonShape =
    'polygon(0 0, 100% 0, calc(100% - 15px) 20px, 100% 40px, 0 40px)'

  const ribbonShape = () =>
    alignment() === 'left' ? leftRibbonShape : rightRibbonShape

  return (
    <div
      class={twMerge(
        'flex w-full flex-col gap-2',
        alignment() === 'left' ? 'items-start' : 'items-end',
      )}
      style={{
        '--main-ribbon-color': mainRibbonColor(),
        '--main-ribbon-shade-color': mainRibbonShadeColor(),
      }}
    >
      <div
        class={`relative flex h-[40px] w-full items-center justify-center bg-[var(--main-ribbon-color)] font-bold text-white`}
        style={{
          'clip-path': ribbonShape(),
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
            class={twMerge(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-green-500 px-2 py-0.5 text-xxs font-bold text-white shadow-sm',
              alignment() === 'right' && 'right-2',
              alignment() === 'left' && 'left-2',
            )}
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
          class={`flex h-[40px] w-full items-center justify-center bg-white font-bold text-[var(--main-ribbon-color)]`}
          style={{
            'clip-path': ribbonShape(),
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

      <CampaignGoalOverlayDebug />
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
        <CampaignGoalOverlayProvider {...props}>
          <Body />
        </CampaignGoalOverlayProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}
