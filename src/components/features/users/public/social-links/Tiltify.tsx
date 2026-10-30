import {type Component} from "solid-js";
import { TiltifyIcon } from '../../../../common/icons/JJIcons.tsx'

interface TiltifyProps {
  url: string;
  name?: string;
}

export const Tiltify: Component<TiltifyProps> = (props) => {
  const name = props.name || "Tiltify";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-group px-2 py-1.5 text-fg-muted transition-colors hover:text-tiltify hover:bg-tiltify/10"
    >
      <TiltifyIcon class="size-5" />
      <p class="text-xxs font-medium">{name}</p>
    </a>
  );
};
