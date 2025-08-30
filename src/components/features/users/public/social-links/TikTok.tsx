import { type Component } from "solid-js";
import { FaBrandsTiktok } from "solid-icons/fa";

interface TikTokProps {
  url: string;
  name?: string;
}

export const TikTok: Component<TikTokProps> = (props) => {
  const name = props.name || "TikTok";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-tiktok hover:bg-tiktok/10"
    >
      <FaBrandsTiktok class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
