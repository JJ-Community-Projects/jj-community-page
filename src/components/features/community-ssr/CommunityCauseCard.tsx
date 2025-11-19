import { type Component, Show } from 'solid-js'
import type { JJCauseType } from '../../../lib/orpc/private/jjData/contract.ts'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { twMerge } from 'tailwind-merge'
import { Numeric } from 'solid-i18n'

export const CommunityCauseCard: Component<{ cause: JJCauseType }> = (
  props,
) => {
  const { cause } = props
  const { currency } = useCommunityPage()
  const title = () => cause.name
  const img = () => cause.logo
  const raised = () => {
    if (currency() === 'USD') {
      return cause.raised.usd
    }
    if (currency() === 'EUR') {
      return cause.raised.euro
    }
    return cause.raised.gbp
  }
  return (
    <div
      class={twMerge(
        'mx-auto w-full max-w-[520px] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class={'flex h-full w-full flex-col gap-2 p-2.5'}>
        <div class={'flex flex-col items-center gap-2'}>
          <img
            class={'size-14 rounded-lg ring-1 ring-black/10'}
            alt={title()}
            src={img()}
            loading={'lazy'}
          />
          <div class={'w-full min-w-0'}>
            <div class={'flex flex-col items-center gap-1'}>
              <p class={'text-center text-sm font-semibold'}>{title()}</p>
            </div>
            <Show when={cause.description}>
              {(d) => (
                <p class={'line-clamp-2 text-center text-xxs opacity-90'}>
                  {d()}
                </p>
              )}
            </Show>
          </div>
          <div
            class={
              'flex flex-col items-center text-xs font-bold text-primary-600'
            }
          >
            <p>Raised</p>
            <Numeric
              value={raised()}
              numberStyle="currency"
              currency={currency()}
            />
          </div>
        </div>
        <div class={'flex-1'} />
        <div class={'flex gap-2'}>
          <a
            target={'_blank'}
            href={cause.donateUrl}
            class={twMerge(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5',
              'bg-primary-500 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Donate</span>
          </a>
          <a
            target={'_blank'}
            href={cause.url}
            class={twMerge(
              'inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5',
              'bg-neutral-800 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Learn more</span>
          </a>
        </div>
      </div>
    </div>
  )
}
