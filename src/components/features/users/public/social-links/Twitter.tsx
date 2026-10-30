import { type Component } from "solid-js";
import { FaBrandsTwitter } from "solid-icons/fa";

interface TwitterProps {
  url: string;
  name?: string;
}

export const Twitter: Component<TwitterProps> = (props) => {
  const name = props.name || "Twitter";

  return (
    <a
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-group px-2 py-1.5 text-fg-muted transition-colors hover:text-twitter hover:bg-twitter/10"
    >
      <FaBrandsTwitter class="size-5" />
      <p class="text-xxs font-medium">{name}</p>
    </a>
  );
};
