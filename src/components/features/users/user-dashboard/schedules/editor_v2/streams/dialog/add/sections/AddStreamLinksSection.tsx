import {type Component} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {useAddStreamDialog} from "../AddStreamDialogContext.tsx";

export const AddStreamLinksSection: Component = () => {
  const dialog = useAddStreamDialog();
  const draft = () => dialog.draft;

  const updateTwitch =  ((v: string) => {
    dialog.setTwitchVodUrl(v || null);
  });

  const updateYoutube =  ((v: string) => {
    dialog.setYoutubeVodUrl(v || null);
  });

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">VOD Links</h3>
      <TextField value={dialog.draft.twitchVodUrl ?? ""} onChange={updateTwitch}>
        <TextField.Label class="text-xs font-medium mb-1">Twitch VOD URL</TextField.Label>
        <TextField.Input class="w-full px-3 py-2 border rounded" placeholder="https://www.twitch.tv/videos/..." />
      </TextField>
      <TextField value={dialog.draft.youtubeVodUrl ?? ""} onChange={updateYoutube}>
        <TextField.Label class="text-xs font-medium mb-1">YouTube VOD URL</TextField.Label>
        <TextField.Input class="w-full px-3 py-2 border rounded" placeholder="https://youtu.be/..." />
      </TextField>
    </div>
  );
};

export default AddStreamLinksSection;
