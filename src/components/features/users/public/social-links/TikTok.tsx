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
      class="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-group px-2 py-1.5 text-fg-muted transition-colors hover:text-tiktok hover:bg-tiktok/10"
    >
      <FaBrandsTiktok class="size-5" />
      <p class="text-xxs font-medium">{name}</p>
    </a>
  );
};
