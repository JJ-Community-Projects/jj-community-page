import { DateTime } from 'luxon'
import type { YogsStream } from '../orpc/private/yogs/contract.ts'

export class YogsStreamUtils {
  static duration(slot: YogsStream) {
    const start = DateTime.fromJSDate(slot.start)
    const end = DateTime.fromJSDate(slot.end)
    return end.diff(start).as('second')
  }

  static start(slot: YogsStream) {
    return DateTime.fromJSDate(slot.start)
  }

  static end(slot: YogsStream) {
    return YogsStreamUtils.start(slot).plus(YogsStreamUtils.duration(slot))
  }

  static sortByNextStream(a: YogsStream, b: YogsStream, now?: DateTime) {
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

  static nextStream(slot: YogsStream, now?: DateTime) {
    if (!now) {
      now = DateTime.now()
    }
    const start = YogsStreamUtils.start(slot)
    const duration = YogsStreamUtils.duration(slot)

    const add = start.diff(now).as('day') % 7

    return start
  }

  static nextStreamEnd(slot: YogsStream, now?: DateTime) {
    return YogsStreamUtils.nextStream(slot, now).plus(
      YogsStreamUtils.duration(slot),
    )
  }

  static isLive(slot: YogsStream, now?: DateTime) {
    if (!now) {
      now = DateTime.now()
    }
    const start = YogsStreamUtils.nextStream(slot, now)
    const end = YogsStreamUtils.nextStreamEnd(slot, now)
    return now > start && now < end
  }

  static isOver(slot: YogsStream, now?: DateTime) {
    now ??= DateTime.now()
    return (
      now >
      YogsStreamUtils.nextStream(slot, now).plus(YogsStreamUtils.duration(slot))
    )
  }

  static isBefore(slot: YogsStream, now?: DateTime) {
    now ??= DateTime.now()
    return now < YogsStreamUtils.nextStream(slot, now)
  }
}
