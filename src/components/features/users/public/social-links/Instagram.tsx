import { type Component } from "solid-js";
import { FaBrandsInstagram } from "solid-icons/fa";

interface InstagramProps {
  url: string;
  name?: string;
}

export const Instagram: Component<InstagramProps> = (props) => {
  const name = props.name || "Instagram";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-group px-2 py-1.5 text-fg-muted transition-colors hover:text-instagram hover:bg-instagram/10"
    >
      <FaBrandsInstagram class="size-5" />
      <p class="text-xxs font-medium">{name}</p>
    </a>
  );
};
