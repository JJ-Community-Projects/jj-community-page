import { type Component } from "solid-js";
import { FaBrandsYoutube } from "solid-icons/fa";

interface YouTubeProps {
  url: string;
  name?: string;
}

export const YouTube: Component<YouTubeProps> = (props) => {
  const name = props.name || "YouTube";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-youtube hover:bg-youtube/10"
    >
      <FaBrandsYoutube class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
