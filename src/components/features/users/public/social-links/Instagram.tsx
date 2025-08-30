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
      class="flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-instagram hover:bg-instagram/10"
    >
      <FaBrandsInstagram class="size-6" />
      <p class="text-xxs">{name}</p>
    </a>
  );
};
