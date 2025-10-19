import { type Component } from 'solid-js'
import { DateTime } from 'luxon'
import { useNow } from '../../../../../lib/utils/useNow.ts'

interface Props {
  title: string
  timezone: string
  theme?: 'default' | 'red' | 'blue'
}
const bgByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
      return 'bg-primary'
    case 'blue':
      return 'bg-accent'
    default:
      return 'bg-white'
  }
}

const stripeByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
      return 'bg-primary'
    case 'blue':
      return 'bg-accent'
    default:
      return 'bg-primary'
  }
}

const textColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-accent'
  }
}

export const TeamScheduleOverlayHeader: Component<Props> = (props) => {
  const offsetNameShort = () =>
    DateTime.fromObject(
      {
        year: new Date().getFullYear(),
        month: 12,
        day: 1,
      },
      {
        locale: 'en-GB',
      },
    ).setZone(props.timezone).offsetNameShort

  const now = useNow()

  const formatted = () => {
    return now().setZone(props.timezone).toLocaleString(
      {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      },
      {
        locale: 'en-GB',
      },
    )
  }

  return (
    <div
      class={`flex h-auto flex-col items-center justify-center rounded-2xl p-3 text-center shadow-md ${bgByTheme(props.theme)}`}
    >
      <h1
        class={`text-xl font-extrabold tracking-wide md:text-2xl ${textColorByTheme(props.theme)}`}
      >
        {props.title}
      </h1>
      <p
        class={`text-xs font-medium uppercase tracking-wider ${textColorByTheme(props.theme)} md:text-sm`}
      >
        Timezone: {offsetNameShort()}
      </p>
      <p class={`font-mono text-xs ${textColorByTheme(props.theme)}`}>
        Current time: {formatted()}
      </p>
    </div>
  )
}

export const TeamScheduleOverlayHeaderSidebar: Component<Props> = (props) => {
  const offsetNameShort = () =>
    DateTime.fromObject(
      {
        year: new Date().getFullYear(),
        month: 12,
        day: 1,
      },
      {
        locale: 'en-GB',
      },
    ).setZone(props.timezone).offsetNameShort
  const now = useNow()

  const formatted = () => {
    return now().setZone(props.timezone).toLocaleString(
      {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      },
      {
        locale: 'en-GB',
      },
    )
  }
  return (
    <div class="relative flex w-full flex-row overflow-hidden rounded-2xl bg-white">
      <div class={`w-6 md:w-8 ${stripeByTheme(props.theme)}`} />
      <div class="flex flex-1 flex-col py-3 pl-2 pr-4 text-left">
        <h1
          class={`text-xl font-extrabold tracking-wide text-gray-900 md:text-2xl`}
        >
          {props.title}
        </h1>
        <p
          class={`text-xs font-medium uppercase tracking-wider text-gray-700 md:text-sm`}
        >
          Timezone: {offsetNameShort()}
        </p>
        <p class={`font-mono text-xs text-gray-700`}>
          Current time: {formatted()}
        </p>
      </div>
    </div>
  )
}
