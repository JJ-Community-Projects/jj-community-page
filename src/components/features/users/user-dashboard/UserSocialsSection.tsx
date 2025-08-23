import {type Component, createMemo, createSignal, Show,} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {socialUrlRegex} from "../../../../functions/socialUrlRegex.ts";
import {FaSolidArrowsRotate, FaSolidTrash} from "solid-icons/fa";
import {PrimaryLivePlatform} from "./PrimaryLivePlatform.tsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../lib/orpc/client.ts";

const useHook = () => {

  const queryClient = useQueryClient();

  const socialsQuery = useQuery(() =>
    orpcPrivate.social.getSocial.queryOptions({
      staleTime: 30_000,
    })
  );

  const importFromTiltify = useMutation(() =>
    orpcPrivate.social.importFromTiltify.mutationOptions({
      onSuccess: async () => {
        // Invalidate and refetch socials after successful add
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.key()
        });
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.twitch.getTwitchChannel.key()
        });
      },
    })
  );

  const twitchChannelQuery = useQuery(() =>
    orpcPrivate.twitch.getTwitchChannel.queryOptions({
      staleTime: 30_000,
    })
  );

  const addMutation = useMutation(() =>
    orpcPrivate.social.addSocial.mutationOptions({
      onSuccess: async ({provider}) => {
        // Invalidate and refetch socials after successful add
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.key()
        });
        if (provider === 'twitch') {
          await queryClient.invalidateQueries({
            queryKey: orpcPrivate.twitch.getTwitchChannel.key()
          });
        }
      },
      onError: (error) => {
        console.error("Failed to add social:", error);
      }
    })
  );

  const removeMutation = useMutation(() =>
    orpcPrivate.social.removeSocial.mutationOptions({
      onSuccess: async ({provider}) => {
        // Invalidate and refetch socials after successful remove
        await queryClient.invalidateQueries({
          queryKey: orpcPrivate.social.getSocial.key()
        });
        if (provider === 'twitch') {
          await queryClient.invalidateQueries({
            queryKey: orpcPrivate.twitch.getTwitchChannel.key()
          });
        }
      },
      onError: (error) => {
        console.error("Failed to remove social:", error);
      }
    })
  );

  return {
    socialsQuery, twitchChannelQuery, addMutation, removeMutation, importFromTiltify
  }
}

// Twitch Social Component
const TwitchSocial: Component = () => {

  const {twitchChannelQuery, addMutation, removeMutation, socialsQuery} = useHook()

  const [url, setUrl] = createSignal<string>('')
  const [error, setError] = createSignal<string>('')

  const regexes = socialUrlRegex();

  const twitchChannel = () => twitchChannelQuery.data
  const twitchChannelImg = () => twitchChannelQuery.data?.profileImageUrl?.replace('300x300', '70x70')

  const hasTwitchChannel = () => twitchChannel() !== undefined

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.twitch.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid Twitch URL (e.g., https://twitch.tv/username)");
      return;
    }

    try {
      await addMutation.mutate({provider: "twitch", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add Twitch URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "twitch")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">Twitch</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-purple-600 hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "twitch"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://twitch.tv/username"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
      <Show when={hasTwitchChannel()}>
        <div class="flex items-center p-3 mt-2 rounded-md bg-purple-50">
          <img
            class="size-5 rounded-full mr-2"
            src={twitchChannelImg()}
            alt={twitchChannel()?.displayName || "Twitch profile"}
          />
          <p class="text-purple-600">Connected to {twitchChannel()?.displayName}</p>
        </div>
      </Show>
    </div>
  );
};

// YouTube Social Component
const YouTubeSocial: Component = () => {

  const {twitchChannelQuery, addMutation, removeMutation, socialsQuery} = useHook()
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const regexes = socialUrlRegex();

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.youtube.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid YouTube URL (e.g., https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID)");
      return;
    }

    try {
      await addMutation.mutate({provider: "youtube", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add YouTube URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "youtube")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">YouTube</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-red-600 hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "youtube"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  );
};

// Bluesky Social Component
const BlueSkySocial: Component = () => {
  const {addMutation, removeMutation, socialsQuery} = useHook();
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const regexes = socialUrlRegex();

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.bsky.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid Bluesky URL (e.g., https://bsky.app/profile/username.bsky.social, or https://bsky.app/profile/customdomain.com)");
      return;
    }

    try {
      await addMutation.mutate({provider: "bsky", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add Bluesky URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "bsky")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">Bluesky</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sky-500 hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "bsky"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://bsky.app/profile/user@domain.com, username.bsky.social, or username.customdomain.com"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  );
};

// Twitter Social Component
const TwitterSocial: Component = () => {
  const {addMutation, removeMutation, socialsQuery} = useHook();
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const regexes = socialUrlRegex();

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.twitter.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)");
      return;
    }

    try {
      await addMutation.mutate({provider: "twitter", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add Twitter URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "twitter")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">Twitter</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-500 hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "twitter"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://twitter.com/username or https://x.com/username"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  );
};

// TikTok Social Component
const TikTokSocial: Component = () => {
  const {addMutation, removeMutation, socialsQuery} = useHook();
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const regexes = socialUrlRegex();

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.tiktok.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)");
      return;
    }

    try {
      await addMutation.mutate({provider: "tiktok", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add TikTok URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "tiktok")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">TikTok</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-black hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "tiktok"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://tiktok.com/@username"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  );
};

// Instagram Social Component
const InstagramSocial: Component = () => {
  const {addMutation, removeMutation, socialsQuery} = useHook();
  const [url, setUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const regexes = socialUrlRegex();

  const validateUrl = (url: string) => {
    if (!url) return true;
    return regexes.instagram.test(url);
  };

  const handleAdd = async () => {
    if (!validateUrl(url())) {
      setError("Please enter a valid Instagram URL (e.g., https://instagram.com/username)");
      return;
    }

    try {
      await addMutation.mutate({provider: "instagram", url: url()});
      setUrl("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add Instagram URL");
    }
  };

  const social = createMemo(() =>
    socialsQuery.data?.find(s => s.provider === "instagram")
  );

  return (
    <div>
      <h3 class="text-lg font-medium mb-2">Instagram</h3>
      <Show
        when={!social()}
        fallback={
          <div class="flex items-center justify-between p-3 rounded-md">
            <a
              href={social()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-pink-600 hover:underline"
            >
              {social()?.url}
            </a>
            <button
              type="button"
              onClick={() => removeMutation.mutate({provider: "instagram"})}
              class="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <FaSolidTrash/>
            </button>
          </div>
        }
      >
        <div class="flex flex-col space-y-2">
          <TextField
            value={url()}
            onChange={setUrl}
            validationState={error() ? "invalid" : "valid"}
          >
            <div class="flex items-center space-x-2">
              <TextField.Input
                placeholder="https://instagram.com/username"
                class="w-full p-2 border rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                class="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                disabled={addMutation.isPending || !url()}
              >
                Add
              </button>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </TextField>
        </div>
      </Show>
    </div>
  );
};

export const UserSocialsSection: Component = () => {
  // Get user context
  const {importFromTiltify} = useHook()

  return (
    <div class="bg-white p-6">
      <div class="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => importFromTiltify.mutate()}
          class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-400 transition-colors"
          disabled={importFromTiltify.isPending}
          title="Import social links from Tiltify"
        >
          <FaSolidArrowsRotate
            class={importFromTiltify.isPending ? "animate-spin" : ""}
          />
          <span>Import from Tiltify</span>
        </button>
      </div>

      <div class="space-y-6">
        {/* Primary Live Stream Platform */}
        <PrimaryLivePlatform/>

        {/* Social Media Components */}
        <TwitchSocial/>
        <YouTubeSocial/>
        <BlueSkySocial/>
        <TwitterSocial/>
        <TikTokSocial/>
        <InstagramSocial/>
      </div>
    </div>
  );
};
