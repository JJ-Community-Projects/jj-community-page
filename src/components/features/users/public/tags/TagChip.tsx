import { type Component } from "solid-js";

interface TagChipProps {
  name: string;
  primaryColor: string;
}

export const TagChip: Component<TagChipProps> = (props) => {
  return (
    <span
      class="px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200"
      style={{
        "background-color": `${props.primaryColor}15`,
        "color": props.primaryColor
      }}
    >
      {props.name}
    </span>
  );
};
