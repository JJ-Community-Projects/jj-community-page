import {type Component, Show} from "solid-js";
import {TwitchIcon} from "../../../../common/icons/JJIcons.tsx";

interface TwitchLiveProps {
  url: string;
  name?: string
  userId: number
}

export const TwitchLive: Component<TwitchLiveProps> = (props) => {
  const {url, name = 'Twitch', userId} = props
//  const liveStatus = useUserLiveStatus(userId);

  const isLive = () => false; // liveStatus.isLive && liveStatus.channel.twitch !== undefined

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      class="aspect-square group group-hover flex flex-col items-center justify-center hover:scale-105 transition-all rounded-full p-2 hover:text-twitch hover:bg-twitch/10"
    >
      <TwitchIcon class="size-6" />
      <Show when={isLive()} fallback={<p class="text-xxs">{name}</p>}>
        <div class="bg-red-500 animate-pulse text-white text-xxxs font-bold px-0.5 py-0.25 mt-0.5 rounded-full z-10 group-hover:bg-twitch">
          LIVE
        </div>
      </Show>
    </a>
  );
}

/*

        <Show when={isLive()}>
          <div class="absolute -bottom-1 bg-black text-white text-xxxs font-bold px-0.5 py-0.25 rounded-full z-10 group-hover:bg-twitch">
            LIVE
          </div>
        </Show>
 */
