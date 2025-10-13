import { type Component, createSignal } from 'solid-js'
import { Accordion } from '@kobalte/core'
import { twMerge } from 'tailwind-merge'
import { FaSolidChevronDown } from 'solid-icons/fa'
import { QueryClientProvider } from '@tanstack/solid-query'
import { QueryClient } from '@tanstack/query-core'
import ScheduleSection from './ScheduleSection'
import ScheduleSimpleSection from './ScheduleSimpleSection'
import FundraisersSection from './FundraisersSection'
import CharitiesSection from './CharitiesSection'
import Charities2Section from './Charities2Section'
import { UserProvider } from '../../users/user-dashboard/providers/UserProvider.tsx'
import type { User } from '../../../../lib/auth/User.ts'

const Body: Component = () => {
  const [expanded, setExpanded] = createSignal<string[]>([])

  const isOpen = (v: string) => expanded().includes(v)

  return (
    <div class="hidden items-center text-base text-white accent-accent-500 md:flex md:flex-col">
      <Accordion.Root collapsible value={expanded()} onChange={setExpanded}>
        {/* Schedule (Full) */}
        <Accordion.Item
          value="schedule"
          class="flex flex-col items-center transition-all"
        >
          <Accordion.Header>
            <Accordion.Trigger
              class={twMerge(
                'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-[30vw] flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
              )}
            >
              <p class="flex-1 text-left">Schedule</p>
              <FaSolidChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  isOpen('schedule') && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="max-w-[90vw] p-2">
            <ScheduleSection visible={isOpen('schedule')} />
          </Accordion.Content>
        </Accordion.Item>

        {/* Schedule Simple */}
        <Accordion.Item
          value="schedule-simple"
          class="flex flex-col items-center transition-all"
        >
          <Accordion.Header>
            <Accordion.Trigger
              class={twMerge(
                'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-[30vw] flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
              )}
            >
              <p class="flex-1 text-left">Schedule (Simple)</p>
              <FaSolidChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  isOpen('schedule-simple') && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="max-w-[90vw] p-2">
            <ScheduleSimpleSection visible={isOpen('schedule-simple')} />
          </Accordion.Content>
        </Accordion.Item>

        {/* Fundraisers */}
        <Accordion.Item
          value="fundraisers"
          class="flex flex-col items-center transition-all"
        >
          <Accordion.Header>
            <Accordion.Trigger
              class={twMerge(
                'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-[30vw] flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
              )}
            >
              <p class="flex-1 text-left">Community Fundraisers</p>
              <FaSolidChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  isOpen('fundraisers') && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="max-w-[90vw] p-2">
            <FundraisersSection visible={isOpen('fundraisers')} />
          </Accordion.Content>
        </Accordion.Item>

        {/* Charities */}
        <Accordion.Item
          value="charities"
          class="flex flex-col items-center transition-all"
        >
          <Accordion.Header>
            <Accordion.Trigger
              class={twMerge(
                'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-[30vw] flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
              )}
            >
              <p class="flex-1 text-left">Charities</p>
              <FaSolidChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  isOpen('charities') && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="max-w-[90vw] p-2">
            <CharitiesSection visible={isOpen('charities')} />
          </Accordion.Content>
        </Accordion.Item>

        {/* Charities 2 */}
        <Accordion.Item
          value="charities2"
          class="flex flex-col items-center transition-all"
        >
          <Accordion.Header>
            <Accordion.Trigger
              class={twMerge(
                'hover:scale-102 hover:brightness-102 border-1 group m-2 flex w-[30vw] flex-row items-center rounded border-accent-500 bg-primary-200/50 p-2 text-xl text-white shadow',
              )}
            >
              <p class="flex-1 text-left">Charities 2</p>
              <FaSolidChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  isOpen('charities2') && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class="max-w-[90vw] p-2">
            <Charities2Section visible={isOpen('charities2')} />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}

export const OverlayOverviewV2: Component<{ user: User }> = (props) => {
  return (
    <UserProvider user={props.user}>
      <QueryClientProvider client={new QueryClient()}>
        <Body />
      </QueryClientProvider>
    </UserProvider>
  )
}
