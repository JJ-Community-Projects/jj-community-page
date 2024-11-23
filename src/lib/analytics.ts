import type {FullCreator, FullStream} from "./model/ContentTypes.ts";
import {DateTime} from "luxon";

export const log = (eventName: string, data: { [key: string]: any }) => {
  try {
    // @ts-ignore
    window.gtag('event', eventName, data)
  } catch (e) {
    console.error(e)
  }
}

export const logSlotClick = (slot: FullStream) => {
  const start = DateTime.fromJSDate(slot.start)
  const data = {
    slot_title: slot.title,
    slot_year: start.year,
    event_label: `${start.year}_${start.day}_${start.hour}`,
  }
  log('click_slot', data)
}

export const logCreator = (creator: FullCreator) => {
  log('click_creator', {
    name: creator.name,
  })
}
