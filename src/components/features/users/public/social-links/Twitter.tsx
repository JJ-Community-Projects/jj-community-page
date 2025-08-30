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
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-twitter hover:bg-twitter/10"
    >
      <FaBrandsTwitter class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
