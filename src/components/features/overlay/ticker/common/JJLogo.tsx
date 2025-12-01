import { type VoidComponent } from 'solid-js'
import red from '../../../../../images/overlay/Jingle_Jam_Logo_2025_Red.png'
import blue from '../../../../../images/overlay/Jingle_Jam_Logo_2025_Blue.png'

interface TitleProps {
  theme?: 'default' | 'red' | 'blue'
}

export const JJLogo: VoidComponent<TitleProps> = props => {
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

  const src = () => {
    switch (theme()) {
      case 'red':
        return red.src
      case 'blue':
        return blue.src
      default:
        return red.src
    }
  }

  return (
    <div
      class={`flex h-full w-full flex-col items-center justify-center rounded-2xl ${background()} p-8 shadow-2xl`}
    >
      <img src={src()} class={'object-contain'} alt={'jj logo'} />
    </div>
  )
}
