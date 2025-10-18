import { type Component, createSignal } from 'solid-js'
import { Accordion } from '@kobalte/core'
import { twMerge } from 'tailwind-merge'
import { FaSolidChevronDown } from 'solid-icons/fa'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import { UserScheduleConfigurator } from '../userSchedule/UserScheduleConfigurator.tsx'
import { FundraisersTickerConfigurator } from '../ticker/fundraisers/FundraisersTickerConfigurator.tsx'
import { CharitiesTickerConfigurator } from '../ticker/charities/CharitiesTickerConfigurator.tsx'
import { CharitiesConfigurator } from '../charities/CharitiesConfigurator.tsx'
import { FundraisersByTeamConfigurator } from '../ticker/fundraisers/FundraisersByTeamConfigurator.tsx'
import { FundraisersByCauseConfigurator } from '../ticker/fundraisers/FundraisersByCauseConfigurator.tsx'
import { UserProvider } from '../../users/user-dashboard/providers/UserProvider.tsx'
import type { User } from '../../../../lib/auth/User.ts'
import { TeamScheduleConfigurator } from '../teamSchedule/TeamScheduleConfigurator.tsx'

const Body: Component = () => {
  const [expanded, setExpanded] = createSignal<string[]>([])

  const isOpen = (v: string) => expanded().includes(v)

  return (
    <Accordion.Root
      collapsible
      value={expanded()}
      onChange={setExpanded}
      class="w-full flex-col text-base text-white accent-accent-500"
    >
      {/* Panels Section Header */}
      <div class="mx-2 mt-4 w-full text-left text-2xl font-semibold text-white/90">
        Panels
      </div>

      {/* Charities Panel */}
      <Accordion.Item
        value="charities2"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Charities Panel</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('charities2') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <CharitiesConfigurator visible={isOpen('charities2')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Schedule (Full) */}
      <Accordion.Item
        value="schedule"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Primary User Schedule Panel</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('schedule') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <UserScheduleConfigurator visible={isOpen('schedule')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Team Schedule (Full) */}
      <Accordion.Item
        value="team-schedule"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Team Schedule Panel</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('team-schedule') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <TeamScheduleConfigurator visible={isOpen('team-schedule')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Tickers Section Header */}
      <div class="mx-2 mt-6 w-full text-left text-2xl font-semibold text-white/90">
        Tickers
      </div>

      {/* Charities Ticker */}
      <Accordion.Item
        value="charities"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Charities Ticker</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('charities') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <CharitiesTickerConfigurator visible={isOpen('charities')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Fundraisers */}
      <Accordion.Item
        value="fundraisers"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">All Fundraisers Ticker</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('fundraisers') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <FundraisersTickerConfigurator visible={isOpen('fundraisers')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Team Fundraiser */}
      <Accordion.Item
        value="team-fundraiser"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Fundraisers by Team Ticker</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('team-fundraiser') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <FundraisersByTeamConfigurator visible={isOpen('team-fundraiser')} />
        </Accordion.Content>
      </Accordion.Item>

      {/* Cause Fundraiser */}
      <Accordion.Item
        value="cause-fundraiser"
        class="flex w-full flex-col items-center transition-all"
      >
        <Accordion.Header class="w-full">
          <Accordion.Trigger
            class={twMerge(
              'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-full flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
            )}
          >
            <p class="flex-1 text-left">Fundraisers by Cause Ticker</p>
            <FaSolidChevronDown
              class={twMerge(
                'transition-all group-hover:animate-none',
                isOpen('cause-fundraiser') && 'rotate-180 animate-none',
              )}
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="w-full p-2">
          <FundraisersByCauseConfigurator
            visible={isOpen('cause-fundraiser')}
          />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}

export const OverlayConfiguration: Component<{ user: User }> = (props) => {
  return (
    <UserProvider user={props.user}>
      <QueryClientProvider client={new QueryClient()}>
        <Body />
      </QueryClientProvider>
    </UserProvider>
  )
}
