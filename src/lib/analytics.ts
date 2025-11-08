import { DateTime } from 'luxon'
import type { YogsCreator, YogsStream } from './orpc/private/yogs/contract.ts'

export const log = (eventName: string, data: { [key: string]: any }) => {
  try {
    // @ts-ignore
    window.gtag('event', eventName, data)
  } catch (e) {
    console.error(e)
  }
}

export const logSlotClick = (slot: YogsStream) => {
  const start = DateTime.fromJSDate(slot.start)
  const data = {
    slot_title: slot.title,
    slot_year: start.year,
    event_label: `${start.year}_${start.day}_${start.hour}`,
  }
  log('click_slot', data)
}
export const logCreatorFromSlotClick = (
  creator: YogsCreator,
  slot: YogsStream,
) => {
  const start = DateTime.fromJSDate(slot.start)
  const data = {
    slot_title: slot.title,
    slot_year: start.year,
    event_label: `${start.year}_${start.day}_${start.hour}`,
    name: creator.name,
  }
  log('click_creator_slot', data)
}
export const logCreatorSlotFilterClick = (
  creator: YogsCreator,
  slot: YogsStream,
) => {
  const start = DateTime.fromJSDate(slot.start)
  const data = {
    slot_title: slot.title,
    slot_year: start.year,
    event_label: `${start.year}_${start.day}_${start.hour}`,
    name: creator.name,
  }
  log('creator_slot_filter', data)
}

export const logCreator = (creator: YogsCreator) => {
  log('click_creator', {
    name: creator.name,
  })
}
