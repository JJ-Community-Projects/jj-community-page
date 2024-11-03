import {DateTime} from "luxon";
import type {FullStream} from "../model/ContentTypes.ts";

export class YogsStreamUtils {
  static duration(slot: FullStream) {
    const start = DateTime.fromJSDate(slot.start)
    const end = DateTime.fromJSDate(slot.end)
    return end.diff(start).as('second')
  }

  static start(slot: FullStream) {
    return DateTime.fromJSDate(slot.start)
  }

  static end(slot: FullStream) {
    return YogsStreamUtils.start(slot).plus(YogsStreamUtils.duration(slot))
  }

  static sortByNextStream(a: FullStream, b: FullStream, now?: DateTime) {
    if (YogsStreamUtils.isLive(a, now) && !YogsStreamUtils.isLive(b, now)) {
      return -1
    }
    if (YogsStreamUtils.isLive(b, now) && !YogsStreamUtils.isLive(a, now)) {
      return 1
    }

    const startA = YogsStreamUtils.nextStream(a, now)
    const startB = YogsStreamUtils.nextStream(b, now)
    return startA.diff(startB).as('second')
  }

  static nextStream(slot: FullStream, now?: DateTime) {
    if (!now) {
      now = DateTime.now()
    }
    const start = YogsStreamUtils.start(slot)
    const duration = YogsStreamUtils.duration(slot)

    const add = start.diff(now).as('day') % 7

      return start
  }

  static nextStreamEnd(slot: FullStream, now?: DateTime) {
    return YogsStreamUtils.nextStream(slot, now).plus(YogsStreamUtils.duration(slot))
  }

  static isLive(slot: FullStream, now?: DateTime) {
    if (!now) {
      now = DateTime.now()
    }
    const start = YogsStreamUtils.nextStream(slot, now)
    const end = YogsStreamUtils.nextStreamEnd(slot, now)
    return now > start && now < end
  }

  static isOver(slot: FullStream, now?: DateTime) {
    now ??= DateTime.now()
    return now > YogsStreamUtils.nextStream(slot, now).plus(YogsStreamUtils.duration(slot))
  }

  static isBefore(slot: FullStream, now?: DateTime) {
    now ??= DateTime.now()
    return now < YogsStreamUtils.nextStream(slot, now)
  }
}
