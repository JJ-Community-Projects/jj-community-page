import { type Component } from 'solid-js'
import { twMerge } from 'tailwind-merge'

export type RibbonStyle = 'red' | 'blue' | 'black'
export type RibbonAlignment = 'left' | 'right' | 'center'

export interface BasicRibbonLabelOverlayProps {
  style?: RibbonStyle
  alignment?: RibbonAlignment
  text?: string
}

const mainRibbonColor = (style?: RibbonStyle) => {
  if (style === 'blue') return '#3584BF'
  if (style === 'black') return '#313131'
  return '#E30E50'
}

// Provide three clip-path variants matching other JJ ribbon visuals
const rightRibbonShape =
  'polygon(' +
  '0 0, ' +
  '100% 0, ' +
  '100% 40px, ' +
  '0 40px, ' +
  '15px 20px' +
  ')'

const leftRibbonShape =
  'polygon(' +
  '0 0, ' +
  '100% 0, ' +
  'calc(100% - 15px) 20px, ' +
  '100% 40px, ' +
  '0 40px' +
  ')'

const centerRibbonShape =
  'polygon(' +
  '0 0, ' +
  '100% 0, ' +
  'calc(100% - 15px) 20px, ' +
  '100% 40px,' +
  '0 40px,' +
  '15px 20px' +
  ')'

export const BasicRibbonLabelOverlay: Component<
  BasicRibbonLabelOverlayProps
> = (props) => {
  const ribbonShape = () =>
    props.alignment === 'left'
      ? leftRibbonShape
      : props.alignment === 'right'
        ? rightRibbonShape
        : centerRibbonShape

  const bgClass = () =>
    props.style === 'blue'
      ? 'bg-accent-500'
      : props.style === 'black'
        ? 'bg-black'
        : 'bg-primary-500'

  return (
    <div
      class={twMerge(
        'flex w-full items-center justify-center',
      )}
      style={{ '--main-ribbon-color': mainRibbonColor(props.style) }}
    >
      <div
        class={twMerge(
          'relative flex h-[40px] min-w-[120px] max-w-full items-center justify-center px-3 font-bold text-white',
          // Add a touch more horizontal padding when centered so text stays clear of angled ends
          props.alignment === 'center' && 'px-5',
          bgClass(),
        )}
        style={{ 'clip-path': ribbonShape() }}
      >
        <p class="w-full truncate px-2 text-center text-xl">
          {props.text ?? ''}
        </p>
      </div>
    </div>
  )
}

export default BasicRibbonLabelOverlay
