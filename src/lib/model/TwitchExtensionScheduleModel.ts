import type {FullDay, FullSchedule, FullStream} from "./ContentTypes.ts";


export function fullScheduleToTESSchedule(fullSchedule: FullSchedule): TwitchExtensionSchedule {
  const fullDays = fullSchedule.weeks.flatMap(week => week.days)
  const days: TESDay[] = fullDays.map(fullDayToTESDay)
  return {days}
}

function fullDayToTESDay(fullDay: FullDay): TESDay {
  const streams: TESStream[] = fullDay.streams.map(fullStreamToTESStream)
  return {
    date: fullDay.date.toISOString(),
    streams
  }
}

function fullStreamToTESStream(fullStream: FullStream): TESStream {
  return {
    title: fullStream.title,
    subtitle: fullStream.subtitle,
    description: fullStream.description,
    start: fullStream.start.toISOString(),
    end: fullStream.end.toISOString(),
    twitchVods: twitchVodsFromStream(fullStream),
    creators: creators(fullStream),
    style: {
      background: {
        colors: fullStream.style.background.colors,
        orientation: fullStream.style.background.orientation
      }
    }
  }
}

function twitchVodsFromStream(stream: FullStream): TESTwitchLink[] {
  return stream.vods?.filter((vod) => vod.type === 'twitch')
    .map(vod => {
      return {
        label: vod.label ?? 'VOD',
        url: vod.link
      }
    }) ?? []
}


function creators(stream: FullStream): TESTwitchLink[] {
  return stream.creators?.map(creator => {
    return {
      label: creator.name,
      url: creator.twitchUser ? `http://twitch.tv/${creator.twitchUser?.login}` :
        'http://twitch.tv/yogscast'
    }
  }) ?? []
}

export type TwitchExtensionSchedule = {
  days: TESDay[]
}

type TESDay = {
  date: string
  streams: TESStream[]
}

type TESStream = {
  title: string
  subtitle?: string
  description?: string
  start: string
  end: string
  twitchVods?: TESTwitchLink[]
  creators?: TESTwitchLink[]
  style: {
    background: {
      colors?: string[]
      orientation: 'TD' | 'LR' | 'RL' | 'DT' | 'TLBR' | 'TRBL'
    }
  }
}

type TESTwitchLink = {
  label: string
  url: string
}
