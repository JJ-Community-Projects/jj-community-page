import { type Component } from 'solid-js'
import { DateTime } from 'luxon'

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

const textColorByTheme = (theme: string | undefined) => {
  switch (theme) {
    case 'red':
    case 'blue':
      return 'text-white'
    default:
      return 'text-accent'
  }
}

// Basic header for overlay-v2 team schedule
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
    </div>
  )
}
