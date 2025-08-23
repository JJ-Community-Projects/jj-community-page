import {type Component, createMemo, createSignal, Match, Show, Switch} from "solid-js";
import {RadioGroup} from "@kobalte/core/radio-group";
import {useMutation, useQueries, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";

export const PrimaryLivePlatform: Component = () => {

  const client = useQueryClient();

  const mutation = useMutation(() =>
    orpcPrivate.profile.updatePrimaryLiveStream.mutationOptions({
      onSuccess: async () => {
        await client.invalidateQueries({
          queryKey: orpcPrivate.profile.getPrimaryLiveStream.key()
        })
        await client.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.key()
        })
      }
    })
  )

  const [primaryLiveStream, socials] = useQueries(() => ({
    queries: [orpcPrivate.profile.getPrimaryLiveStream.queryOptions(), orpcPrivate.social.getSocial.queryOptions()]
  }))
  // Both queries have data - render the main component
  const [selectedPlatform, setSelectedPlatform] = createSignal(primaryLiveStream.data);

  // Check if the user has the appropriate social for their selected platform
  const hasPlatformSocial = createMemo(() => {
    const platform = selectedPlatform();
    return socials.data?.some(social => social.provider === platform) || false;
  });

  const handlePlatformChange = async (platform: string) => {
    try {
      setSelectedPlatform(platform);
      mutation.mutate(platform as any)
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

      <Switch>
        <Match when={primaryLiveStream.isPending || socials.isPending}>
          <div class="text-gray-500 text-center py-4">Loading platform settings...</div>
        </Match>

        <Match when={primaryLiveStream.error || socials.error}>
          <div class="text-center py-4">
            <p class="text-red-500 mb-2">Failed to load platform settings</p>
            <button
              onClick={() => {
                primaryLiveStream.refetch();
                socials.refetch();
              }}
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </Match>

        <Match when={primaryLiveStream.data != null && socials.data != null}>
          <>
            <RadioGroup
              value={selectedPlatform()!}
              onChange={handlePlatformChange}
              class="space-y-2 flex flex-row"
              disabled={mutation.isPending}
            >
              <RadioGroup.Item value="twitch" class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroup.ItemInput/>
                <RadioGroup.ItemControl class="w-4 h-4 border border-gray-300 rounded-full">
                  <RadioGroup.ItemIndicator class="w-2 h-2 bg-purple-600 rounded-full"/>
                </RadioGroup.ItemControl>
                <RadioGroup.ItemLabel class="text-purple-600 font-medium">Twitch</RadioGroup.ItemLabel>
              </RadioGroup.Item>

              <RadioGroup.Item value="youtube"
                               class="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50">
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
                  Warning: You have selected {selectedPlatform()} as your primary live stream platform, but you
                  don't have a {selectedPlatform()} account linked.
                  Please add your {selectedPlatform()} account below.
                </p>
              </div>
            </Show>
          </>
        </Match>
      </Switch>
    </div>
  );
};
