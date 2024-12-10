import {type Component, createSignal} from "solid-js";
import Stats2023 from '../../stats/2023.json'
import Stats2022 from '../../stats/2021.json'
import Stats2021 from '../../stats/2021.json'
import All from '../../stats/all.json'
import {type Stats} from "../../lib/model/Stats.ts";
import {StreamStats} from "./graphs/StreamStats.tsx";
import {CreatorStats} from "./graphs/CreatorStats.tsx";
import type {FullCreator} from "../../lib/model/ContentTypes.ts";
import {CreatorProvider} from "./provider/CreatorProvider.tsx";
import { Accordion } from "@kobalte/core";
import { BiRegularChevronDown } from "solid-icons/bi";
import {twMerge} from "tailwind-merge";

interface StreamStatsProps {
  creatorMap: { [key: string]: FullCreator }
}

export const StatsPageRoot: Component<StreamStatsProps> = (props) => {
  const stats2023: Stats = Stats2023
  const stats2022: Stats = Stats2022
  const stats2021: Stats = Stats2021
  const all: Stats = All

  const [expandedItem, setExpandedItem] = createSignal<string[]>([])
  const is2023 = () => expandedItem().includes('2023')
  const is2022 = () => expandedItem().includes('2022')
  const is2021 = () => expandedItem().includes('2021')
  const isAll = () => expandedItem().includes('all')

  return (
    <CreatorProvider creatorMap={props.creatorMap}>
      <Accordion.Root collapsible={true} value={expandedItem()} onChange={setExpandedItem} class={'hidden md:block'}>
        <Accordion.Item value={'all'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
              }
            >
              <p class={'flex-1 text-left'}>2021-2023</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', isAll() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'max-w-[90vw] p-2'}>
            <div class={'flex flex-col gap-4'}>
              <StreamStats stats={all}/>
              <CreatorStats stats={all}/>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'2023'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
              }
            >
              <p class={'flex-1 text-left'}>2023</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', is2023() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'flex max-w-[90vw] flex-col items-center p-2'}>
            <div class={'flex flex-col gap-4'}>
              <StreamStats stats={stats2023}/>
              <CreatorStats stats={stats2023}/>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'2022'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
              }
            >
              <p class={'flex-1 text-left'}>2022</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', is2022() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'flex max-w-[90vw] flex-col items-center p-2'}>
            <div class={'flex flex-col gap-4'}>
              <StreamStats stats={stats2022}/>
              <CreatorStats stats={stats2022}/>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'2021'} class={'flex flex-col items-center transition-all'}>
          <Accordion.Header>
            <Accordion.Trigger
              class={
                'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
              }
            >
              <p class={'flex-1 text-left'}>2021</p>
              <BiRegularChevronDown
                class={twMerge('transition-all group-hover:animate-none', is2021() && 'rotate-180 animate-none')}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content class={'flex max-w-[90vw] flex-col items-center p-2'}>
            <div class={'flex flex-col gap-4'}>
              <StreamStats stats={stats2021}/>
              <CreatorStats stats={stats2021}/>
            </div>
          </Accordion.Content>
        </Accordion.Item>

      </Accordion.Root>
    </CreatorProvider>

  );
}
