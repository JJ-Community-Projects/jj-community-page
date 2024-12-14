import {type Accessor, type Component, createSignal} from "solid-js";
import Stats2024 from '../../stats/2024.json'
import Stats2023 from '../../stats/2023.json'
import Stats2022 from '../../stats/2021.json'
import Stats2021 from '../../stats/2021.json'
import Stats2020 from '../../stats/2020.json'
import All from '../../stats/all.json'
import {type Stats} from "../../lib/model/Stats.ts";
import {StreamStats} from "./graphs/StreamStats.tsx";
import {CreatorStats} from "./graphs/CreatorStats.tsx";
import type {FullCreator} from "../../lib/model/ContentTypes.ts";
import {CreatorProvider} from "./provider/CreatorProvider.tsx";
import {Accordion} from "@kobalte/core";
import {BiRegularChevronDown} from "solid-icons/bi";
import {twMerge} from "tailwind-merge";

interface StreamStatsProps {
  creatorMap: { [key: string]: FullCreator }
}

export const StatsPageRoot: Component<StreamStatsProps> = (props) => {
  const stats2024: Stats = Stats2024
  const stats2023: Stats = Stats2023
  const stats2022: Stats = Stats2022
  const stats2021: Stats = Stats2021
  const stats2020: Stats = Stats2020
  const all: Stats = All

  const [expandedItem, setExpandedItem] = createSignal<string[]>([])

  return (
    <CreatorProvider creatorMap={props.creatorMap}>
      <Accordion.Root collapsible={true} value={expandedItem()} onChange={setExpandedItem} class={'hidden md:block'}>
        <Year stats={all} key={'all'} title={'2020-2024'} expandedItem={expandedItem}/>
        <Year stats={stats2024} key={'2024'} title={'2024 (Incomplete)'} expandedItem={expandedItem}/>
        <Year stats={stats2023} key={'2023'} title={'2023'} expandedItem={expandedItem}/>
        <Year stats={stats2022} key={'2022'} title={'2022'} expandedItem={expandedItem}/>
        <Year stats={stats2021} key={'2021'} title={'2021'} expandedItem={expandedItem}/>
        <Year stats={stats2020} key={'2020'} title={'2020'} expandedItem={expandedItem}/>
      </Accordion.Root>
      <p class={'block md:hidden text-center text-white'}>The statistics are not visible on mobile.</p>
      <p class={'text-center text-white'}>Some of the statistics regarding appearance might not be accurate.</p>
      <p class={'text-center text-white'}>Some donation statistics .</p>
      <a class={'underline text-white'} href={'https://docs.google.com/spreadsheets/d/11Ua2EVlmLCtMKSwKDHnLI8jGvkgJV8BMMHZ1sWowRn0/edit?gid=528381217#gid=528381217'} target={'_blank'}>
        Jingle Jam Donation Tracker
      </a>
    </CreatorProvider>

  );
}
// <Year stats={stats2024} key={'2024'} title={'2024'} expandedItem={expandedItem}/>

const Year: Component<{ stats: Stats, key: string, title: string, expandedItem: Accessor<string[]> }> = (props) => {

  const isOpen = () => props.expandedItem().includes(props.key)
  return (


    <Accordion.Item value={props.key} class={'flex flex-col items-center transition-all'}>
      <Accordion.Header>
        <Accordion.Trigger
          class={
            'hover:scale-102 hover:brightness-102 bg-primary-200/50 border-accent-500 border-1 group m-2 flex w-[30vw] flex-row items-center rounded p-2 text-xl text-white shadow'
          }
        >
          <p class={'flex-1 text-left'}>{props.title}</p>
          <BiRegularChevronDown
            class={twMerge('transition-all group-hover:animate-none', isOpen() && 'rotate-180 animate-none')}
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class={'flex max-w-[90vw] flex-col items-center p-2'}>
        <div class={'flex flex-col gap-4'}>
          <StreamStats stats={props.stats}/>
          <CreatorStats stats={props.stats}/>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
