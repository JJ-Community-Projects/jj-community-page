import { type Component, Show } from 'solid-js'
import { TiltifyIcon } from '../../../../common/icons/JJIcons.tsx'

interface JJLinkProps {
  theme?: 'default' | 'red' | 'blue'
  url?: string
}

export const JJLink: Component<JJLinkProps> = (props) => {
  const theme = () => props.theme ?? 'default'
  const background = () => {
    switch (theme()) {
      case 'red':
      case 'blue':
        return 'bg-white'
      default:
        return 'bg-primary-500'
    }
  }
  const link = () => {
    switch (theme()) {
      case 'red':
        return 'text-primary'
      case 'blue':
        return 'text-accent'
      default:
        return 'text-white'
    }
  }

  const hasUrl = () => props.url != undefined

  const url = () => props.url ?? 'jinglejam.tiltify.com'

  const userUrl = () => {
    return props.url?.replace('https://tiltify.com', '')
  }

  return (
    <div
      class={`${background()} flex h-full w-full flex-col items-center justify-center rounded-2xl p-2 shadow-2xl`}
    >
      <Show when={hasUrl()}>
        <div class="flex flex-row items-center gap-1">
          <TiltifyIcon class={'size-4'}/>
          <p class={`text-xs font-bold ${link()}`}>
            {userUrl()}
          </p>
        </div>
      </Show>
      <Show when={!hasUrl()}>
        <p class={`text-xl font-bold ${link()}`}>jinglejam.tiltify.com</p>
      </Show>
    </div>
  )
}
