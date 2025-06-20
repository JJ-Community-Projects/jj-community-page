import {type Component, createEffect, createSignal} from 'solid-js'
import {CharitiesOverviewComponent, CharitiesOverviewComponent2} from './CharityOverviewComponents'
import {FundraiserOverviewComponent} from './FundraiserOverviewComponent'
import {Accordion} from '@kobalte/core'
import {BiRegularChevronDown} from 'solid-icons/bi'
import {twMerge} from 'tailwind-merge'
import {SimpleScheduleOverviewComponent} from "./SimpleScheduleOverviewComponent.tsx";
// import { useAnalytics } from '../../AnalyticsProvider'

export const OverlayOverview: Component = () => {
  const [open, setOpen] = createSignal(false)
  const [open2, setOpen2] = createSignal(false)

  return (
    <Body/>
  )
}

const Body = () => {
  // const { log } = useAnalytics()

  const [expandedItem, setExpandedItem] = createSignal<string[]>([])
  createEffect(() => {
    const items = expandedItem()
    if (items.length > 0) {
      // log('overlay_open', { overlay: items[0] })
    }
  })
  const schedule = () => expandedItem().includes('schedule')
  const customCchedule = () => expandedItem().includes('custom_schedule')
  const fundraiser = () => expandedItem().includes('fundraiser')
  const charities = () => expandedItem().includes('charities')
  const charities2 = () => expandedItem().includes('charities2')
  return (
    <div class={'accent-accent-500 hidden items-center text-base md:flex md:flex-col'}>
      <Accordion.Root collapsible={true} value={expandedItem()} onChange={setExpandedItem} class={''}>
        <Accordion.Item value={'fundraiser'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
              }
            >
              <p class={'flex-1 text-left'}>Community Fundraisers</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', fundraiser() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'max-w-[90vw] p-2'}>
            <FundraiserOverviewComponent/>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value={'charities'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow transition-all'
              }
            >
              <p class={'flex-1 text-left'}>Charities</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', charities() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'max-w-[90vw] p-2'}>
            <CharitiesOverviewComponent/>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value={'charities2'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow transition-all'
              }
            >
              <p class={'flex-1 text-left'}>Charities 2</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', charities2() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'max-w-[90vw] p-2'}>
            <CharitiesOverviewComponent2/>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value={'custom_schedule'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow transition-all'
              }
            >
              <p class={'flex-1 text-left'}>Custom JJ Schedule</p>
              <BiRegularChevronDown
                class={twMerge(
                  'transition-all group-hover:animate-none',
                  customCchedule() && 'rotate-180 animate-none',
                )}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'max-w-[90vw] p-2'}>
            <SimpleScheduleOverviewComponent />
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}
