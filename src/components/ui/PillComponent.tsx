import { type Component, type JSX } from "solid-js";
import { twMerge } from "tailwind-merge";

interface PillComponentProps {
  label: string;
  href?: string;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  class?: string;
}

export const PillComponent: Component<PillComponentProps> = (props) => {
  // Base classes for the pill styling
  const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-all";

  // Merge the base classes with any custom classes provided
  const classes = twMerge(baseClasses, props.class);

  // Render an <a> element if href is provided
  if (props.href) {
    return (
      <a href={props.href} class={classes}>
        {props.label}
      </a>
    );
  }

  // Render a <button> element if onClick is provided
  if (props.onClick) {
    return (
      <button onClick={props.onClick} class={classes}>
        {props.label}
      </button>
    );
  }

  // Render a <p> tag if neither href nor onClick is provided
  return (
    <p class={classes}>
      {props.label}
    </p>
  );
};
