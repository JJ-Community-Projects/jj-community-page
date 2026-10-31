import { type Component } from 'solid-js'
import { dataText } from '../../../../ui/cn'

/** A profile tag tinted with the user's primary colour (text in the colour, a 15 % tint behind). */
export const TagChip: Component<{ name: string; primaryColor: string }> = (
  props,
) => (
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-semibold"
    style={{
      'background-color': `${props.primaryColor}15`,
      color: dataText(props.primaryColor),
    }}
  >
    {props.name}
  </span>
)
