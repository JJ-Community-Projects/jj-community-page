import {Match, type ParentComponent, Switch} from 'solid-js'
import red from '../../images/overlay/Jingle_Jam_Logo_2024_Red.png'
import blue from '../../images/overlay/Jingle_Jam_Logo_2024_Blue.png'
import white from '../../images/overlay/Jingle_Jam_Logo_2024_White.png'

interface TitleProps {
  theme: string
  titleLogo: string
}

export const JJTitleCard: ParentComponent<TitleProps> = props => {
  const background = () => {
    switch (props.theme) {
      case 'pink':
      case 'red':
        return 'bg-primary-500'
      case 'blue':
        return 'bg-accent-500'
      default:
        return 'bg-white'
    }
  }

  return (
    <Switch>
      <Match when={props.titleLogo === 'none'}>
        <div
          class={`flex h-full w-full flex-col items-center justify-center rounded-2xl ${background()} p-2 shadow-2xl`}
        >
          {props.children}
        </div>
      </Match>
      <Match when={props.titleLogo === 'jjred'}>
        <div
          class={`flex h-full w-full flex-col items-center justify-center rounded-2xl ${background()} p-8 shadow-2xl`}
        >
          <img src={red.src} class={'object-contain'} alt={'jj logo'} />
        </div>
      </Match>
      <Match when={props.titleLogo === 'jjblue'}>
        <div
          class={`flex h-full w-full flex-col items-center justify-center rounded-2xl ${background()} p-8 shadow-2xl`}
        >
          <img src={blue.src} class={'object-contain'} alt={'jj logo'} />
        </div>
      </Match>
      <Match when={props.titleLogo === 'jjwhite'}>
        <div
          class={`flex h-full w-full flex-col items-center justify-center rounded-2xl ${background()} p-8 shadow-2xl`}
        >
          <img src={white.src} class={'object-contain'} alt={'jj logo'} />
        </div>
      </Match>
    </Switch>
  )
}
