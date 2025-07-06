import {type Component, createSignal, createMemo, Show} from "solid-js";
import {RadioGroup} from "@kobalte/core/radio-group";
import {useUser} from "./providers/UserProvider.tsx";

export const PrimaryLivePlatform: Component = () => {
  const {local, setPrimaryLiveStream, action} = useUser();
  const [selectedPlatform, setSelectedPlatform] = createSignal(local.primaryLiveStream);

  // Check if the user has the appropriate social for their selected platform
  const hasPlatformSocial = createMemo(() => {
    const platform = selectedPlatform();
    return local.userSocials.some(social => social.provider === platform);
  });

  const handlePlatformChange = async (platform: string) => {
    try {
      setSelectedPlatform(platform);
      await setPrimaryLiveStream(platform);
    } catch (error) {
      console.error("Failed to set primary live stream platform:", error);
    }
  };

  return (
    <div class="mb-6">
      <h3 class="text-lg font-medium mb-2">Primary Live Stream Platform</h3>
      <p class="text-gray-600 mb-4">
        Select your primary live streaming platform. This will be used as your default platform for live streams.
        The Profile picture of your primary live stream platform will be used for your JJ profile.
      </p>

      <RadioGroup
        value={selectedPlatform()}
        onChange={handlePlatformChange}
        class="space-y-2 flex flex-row"
        disabled={action.setPrimaryLiveStream.actionInProgress}
      >
        <RadioGroup.Item value="twitch" class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
          <RadioGroup.ItemInput/>
          <RadioGroup.ItemControl class="w-4 h-4 border border-gray-300 rounded-full">
            <RadioGroup.ItemIndicator class="w-2 h-2 bg-purple-600 rounded-full"/>
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="text-purple-600 font-medium">Twitch</RadioGroup.ItemLabel>
        </RadioGroup.Item>

        <RadioGroup.Item value="youtube" class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
          <RadioGroup.ItemInput/>
          <RadioGroup.ItemControl class="w-4 h-4 border border-gray-300 rounded-full">
            <RadioGroup.ItemIndicator class="w-2 h-2 bg-red-600 rounded-full"/>
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="text-red-600 font-medium">YouTube</RadioGroup.ItemLabel>
        </RadioGroup.Item>

        <RadioGroup.Item value="tiktok" class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
          <RadioGroup.ItemInput/>
          <RadioGroup.ItemControl class="w-4 h-4 border border-gray-300 rounded-full">
            <RadioGroup.ItemIndicator class="w-2 h-2 bg-black rounded-full"/>
          </RadioGroup.ItemControl>
          <RadioGroup.ItemLabel class="text-black font-medium">TikTok</RadioGroup.ItemLabel>
        </RadioGroup.Item>
      </RadioGroup>

      {/* Warning message if the user doesn't have the appropriate social */}
      <Show when={!hasPlatformSocial()}>
        <div class="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800">
          <p class="text-sm font-medium">
            Warning: You have selected {selectedPlatform()} as your primary live stream platform, but you don't have a {selectedPlatform()} account linked.
            Please add your {selectedPlatform()} account below.
          </p>
        </div>
      </Show>
    </div>
  );
};
