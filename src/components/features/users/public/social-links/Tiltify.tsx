import {type Component} from "solid-js";
import { BskyIcon, TiltifyIcon } from '../../../../common/icons/JJIcons.tsx'

interface BlueSkyProps {
  url: string;
  name?: string;
}

export const Tiltify: Component<BlueSkyProps> = (props) => {
  const name = props.name || "Tiltify";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-tiltify hover:bg-bluesky/10"
    >
      <TiltifyIcon class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
