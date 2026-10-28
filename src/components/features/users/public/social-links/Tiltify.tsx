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
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-tiltify hover:bg-tiltify/10"
    >
      <TiltifyIcon class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
