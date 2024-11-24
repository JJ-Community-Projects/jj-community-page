import {type Component} from "solid-js";
import type {FullCreator} from "../../lib/model/ContentTypes.ts";
import {getTextColor} from "../../lib/utils/textColors.ts";
import {createModalSignal} from "../../lib/createModalSignal.ts";
import {log, logCreator} from "../../lib/analytics.ts";
import {CreatorDialog} from "./CreatorDialog.tsx";

interface CreatorPillProps {
  creator: FullCreator,
  label?: string,
  url?: string,
}

export const CreatorPill: Component<CreatorPillProps> = (props) => {
  const creator = props.creator
  const image = creator?.profileImage
  const twitchUser = creator.twitchUser
  const bg = creator?.style?.primaryColor ?? '#1E95EF'
  const textColor = getTextColor(bg)

  const label = props.label ?? creator.name
  const imageUrl = image?.small ?? image?.medium ?? image?.large ?? twitchUser?.profile_image_url

  const modal = createModalSignal()

  return (
    <>
      <button
        class="cursor-pointer p-2 rounded-full flex flex-row gap-2 items-center hover:scale-105 hover:brightness-105 transition-all duration-200"
        style={{
          'background-color': bg,
          'color': textColor,
        }}
        onclick={() => {
          modal.open()
          logCreator(creator)
        }}
      >
        {
          imageUrl &&
            <img
                src={imageUrl}
                alt={label}
                height="32" width="32"
                class="rounded-full w-8 h-8"
            />
        }
        <span>{label}</span>
      </button>
      <CreatorDialog creator={creator} modalSignal={modal}/>
    </>
  );
}
