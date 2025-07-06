import {createEffect, type Component, Show} from "solid-js";
import { useUserLiveStatus } from "../../../../lib/useUserLiveStatus";
import type { UserPageUI } from "../../../../lib/db/models/user-ui";
import { Dialog } from "@kobalte/core/dialog";
import { createModalSignal } from "../../../../lib/createModalSignal";
import { AiOutlineClose } from "solid-icons/ai";
import { twMerge } from "tailwind-merge";

interface UserLiveAvatarProps {
  user: UserPageUI;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const UserLiveAvatar: Component<UserLiveAvatarProps> = (props) => {
  const { user, size = 'lg' } = props;
  const liveStatus = useUserLiveStatus(user.id);
  const modal = createModalSignal();

  // Twitch purple color
  const TWITCH_PURPLE = "#9146FF";

  // Size mappings for different elements
  const sizeClasses = {
    xs: {
      container: "size-8",
      border: "border-2",
      liveLabel: "text-[0.5rem] px-1 py-0.25",
      liveDot: "h-1.5 w-1.5",
      labelBottom: "-bottom-3",
      labelGap: "gap-0.5"
    },
    sm: {
      container: "size-12",
      border: "border-2",
      liveLabel: "text-xxs px-1.5 py-0.25",
      liveDot: "h-1.5 w-1.5",
      labelBottom: "-bottom-1",
      labelGap: "gap-0.5"
    },
    md: {
      container: "size-16",
      border: "border-3",
      liveLabel: "text-xxs px-2 py-0.5",
      liveDot: "h-2 w-2",
      labelBottom: "bottom-0",
      labelGap: "gap-1"
    },
    lg: {
      container: "size-24",
      border: "border-4",
      liveLabel: "text-xxs px-2 py-0.5",
      liveDot: "h-2 w-2",
      labelBottom: "bottom-0",
      labelGap: "gap-1"
    }
  };

  return (
    <div class={twMerge("relative inline-block")}>
      {/* Avatar container with dynamic border */}
      <div
        class={twMerge(`relative ${sizeClasses[size].container}`)}
        classList={{
          "cursor-pointer": liveStatus.isLive
        }}
        onClick={() => liveStatus.isLive && modal.open()}
      >
        {/* Pulsing border effect when live */}
        <Show when={liveStatus.isLive}>
          <span class={`absolute inset-0 rounded-full ${sizeClasses[size].container}`}>
            <span
              class="absolute inline-flex h-full w-full animate-pulse rounded-full opacity-75 duration-700"
              style={{ "background-color": TWITCH_PURPLE }}
            />
          </span>
        </Show>

        {/* Avatar image */}
        <div
          class={`relative rounded-full overflow-hidden ${sizeClasses[size].container} ${sizeClasses[size].border} z-10`}
          classList={{
            "shadow-xl": liveStatus.isLive
          }}
          style={{
            "border-color": liveStatus.isLive ? 'transparent' : user.style.accentColor
          }}
        >
          <img
            src={user.style.profileImage.default}
            alt={`${user.name}'s profile`}
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* LIVE label */}
      <Show when={liveStatus.isLive}>
        <div class={`absolute ${sizeClasses[size].labelBottom} left-1/2 transform -translate-x-1/2 bg-[#9146FF] text-white font-bold ${sizeClasses[size].liveLabel} rounded-sm flex items-center ${sizeClasses[size].labelGap} z-20 shadow-lg`}>
          <span>LIVE</span>
          <span class={`relative flex ${sizeClasses[size].liveDot}`}>
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-700" />
            <span class="relative inline-flex h-full w-full rounded-full bg-red-500" />
          </span>
        </div>
      </Show>

      {/* User Live Dialog */}
      <Dialog open={modal.isOpen()} onOpenChange={modal.setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
          <div class="fixed inset-0 flex items-center justify-center z-50">
            <Dialog.Content class="bg-white rounded-xl shadow-xl w-full max-w-md">
              <Dialog.Title class="p-2 flex flex-row gap-4 rounded-t-xl">
                <button class="rounded-full hover:bg-accent-200/10 aspect-square"
                        onClick={() => modal.close()}>
                  <AiOutlineClose size={24}/>
                </button>
                <div class="flex flex-col">
                  <p class="text-xl font-bold">{user.name}</p>
                </div>
              </Dialog.Title>

              <div class="p-6">
                <Dialog.Description class="text-gray-600 mb-4">
                  {user.name} is currently live on Twitch!
                </Dialog.Description>

                <div class="flex justify-center mt-6">
                  <div class="flex flex-col items-center">
                    <Show when={liveStatus.channel.twitch}>
                      <a
                        href={`https://twitch.tv/${liveStatus.channel.twitch!.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-4 py-2 bg-twitch text-white rounded-md hover:bg-twitch flex items-center gap-2"
                      >
                        <span>Watch on Twitch</span>
                      </a>
                    </Show>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
};

export default UserLiveAvatar;
