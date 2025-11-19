import type { Component } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { twMerge } from 'tailwind-merge'
import { RadioGroup } from '@kobalte/core/radio-group'

export const SortSelection: Component = () => {
  const { setSortBy, sortBy } = useCommunityPage()

  return (
    <div class={twMerge('flex items-center justify-between')}>
      <RadioGroup
        value={sortBy()}
        onChange={setSortBy}
        class={twMerge('flex flex-col items-end gap-1')}
      >
        <RadioGroup.Label
          class={twMerge(
            'text-xxs font-semibold uppercase tracking-wide text-white',
          )}
        >
          Sort by
        </RadioGroup.Label>
        <div
          class={twMerge(
            'inline-flex w-fit items-center gap-1 rounded-xl p-1 shadow-sm',
            'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
          )}
        >
          <RadioGroup.Item
            value={'raised'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Raised
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'live'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Live
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'cause'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              Cause
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>
        </div>
      </RadioGroup>
    </div>
  )
}

export const CurrencySelection: Component = () => {
  const { currency, setCurrency } = useCommunityPage()

  return (
    <div class={twMerge('flex items-center justify-between')}>
      <RadioGroup
        value={currency()}
        onChange={setCurrency}
        class={twMerge('flex flex-col items-end gap-1')}
      >
        <RadioGroup.Label
          class={twMerge(
            'text-xxs font-semibold uppercase tracking-wide text-white',
          )}
        >
          Currency
        </RadioGroup.Label>
        <div
          class={twMerge(
            'inline-flex w-fit items-center gap-1 rounded-xl p-1 shadow-sm',
            'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
          )}
        >
          <RadioGroup.Item
            value={'GBP'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              GBP
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'USD'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              USD
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>

          <RadioGroup.Item
            value={'EUR'}
            class={twMerge(
              'group relative inline-flex select-none items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700',
              'transition-all duration-200 hover:brightness-105 focus-visible:outline-none',
              'data-[checked]:bg-white data-[checked]:text-primary-500 data-[checked]:shadow',
            )}
          >
            <RadioGroup.ItemInput class={'sr-only'} />
            <RadioGroup.ItemLabel class={'hover:cursor-pointer'}>
              EUR
            </RadioGroup.ItemLabel>
          </RadioGroup.Item>
        </div>
      </RadioGroup>
    </div>
  )
}
