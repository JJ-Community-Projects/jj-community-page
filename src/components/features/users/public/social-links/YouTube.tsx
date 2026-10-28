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
      class="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-group px-2 py-1.5 text-fg-muted transition-colors hover:text-youtube hover:bg-youtube/10"
    >
      <FaBrandsYoutube class="size-5" />
      <p class="text-xxs font-medium">{name}</p>
    </a>
  );
};
