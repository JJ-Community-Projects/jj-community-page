import {type Component} from "solid-js";

interface PCardProps {
  title: string;
}

export const PCard: Component<PCardProps> = (props) => {
  return (
    <div
      class="bg-white block w-fit px-4 py-2 rounded-lg shadow mx-auto mb-4 ">
      <p class="text-base font-bold text-gray-900 text-center inline-flex items-center gap-2">
        <span>{props.title}</span>
      </p>
    </div>
  );
}
