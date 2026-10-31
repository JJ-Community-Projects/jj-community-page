import { type Component } from 'solid-js'

/**
 * A profile tag tinted with the user's primary colour (text in the colour, a 15 % tint behind).
 * Dark mode lightens the text so it stays readable on the dark tile.
 */
export const TagChip: Component<{ name: string; primaryColor: string }> = (
  props,
) => (
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-semibold text-(--tag-color) dark:text-[color-mix(in_srgb,var(--tag-color),white_45%)]"
    style={{
      '--tag-color': props.primaryColor,
      'background-color': `${props.primaryColor}15`,
    }}
  >
    {props.name}
  </span>
)
