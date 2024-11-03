import {type Component, For, Show} from "solid-js";

import {useCreatorFilter} from "../provider/CreatorFilterProvider.tsx";
import {useYogsSchedule} from "../provider/YogsScheduleProvider.tsx";
import {MobileYogsStreamTile} from "./MobileYogsStreamTile.tsx";
import {MobileScheduleHeader} from "./MobileScheduleHeader.tsx";

export const MobileYogsSchedule: Component = () => {
  return (
    <div class={'font-babas flex w-full flex-col tracking-wider gap-4'}>
      <MobileScheduleHeader />
      <MobileScheduleBody />
    </div>
  )
}

const MobileScheduleBody: Component = () => {
  const {day, streams} = useYogsSchedule()
  const { isEmpty, isSlotPartOfFilter } = useCreatorFilter()
  const slots = () => day().streams
  const filteredSlots = () => {
    return streams().filter(isSlotPartOfFilter)
  }

  return (
    <div class={'w-full flex flex-col gap-4'}>
      <Show when={isEmpty()}>
        <For each={slots()}>{slot => <MobileYogsStreamTile stream={slot} />}</For>
      </Show>
      <Show when={!isEmpty()}>
        <For each={filteredSlots()}>{slot => <MobileYogsStreamTile stream={slot} />}</For>
      </Show>
    </div>
  )
}
