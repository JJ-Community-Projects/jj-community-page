import {
  type Component,
  createSignal,
  For,
  Show,
  createMemo,
} from "solid-js";
import { TextField } from "@kobalte/core/text-field";
import { useUser } from "./providers/UserProvider.tsx";
import { socialUrlRegex } from "../../../functions/socialUrlRegex.ts";
import { FaSolidTrash } from "solid-icons/fa";
import { FaSolidArrowsRotate } from "solid-icons/fa";

export const UserSocialsSection: Component = () => {
  // Get user context
  const {
    local,
    addSocial,
    removeSocial,
    fetchSocialsFromTiltify,
    action
  } = useUser();

  // State for social media inputs
  const [twitchUrl, setTwitchUrl] = createSignal("");
  const [twitterUrl, setTwitterUrl] = createSignal("");
  const [bskyUrl, setBskyUrl] = createSignal("");
  const [youtubeUrl, setYoutubeUrl] = createSignal("");
  const [instagramUrl, setInstagramUrl] = createSignal("");
  const [tiktokUrl, setTiktokUrl] = createSignal("");

  // Validation state
  const [twitchError, setTwitchError] = createSignal("");
  const [twitterError, setTwitterError] = createSignal("");
  const [bskyError, setBskyError] = createSignal("");
  const [youtubeError, setYoutubeError] = createSignal("");
  const [instagramError, setInstagramError] = createSignal("");
  const [tiktokError, setTiktokError] = createSignal("");

  // Get regex patterns
  const regexes = socialUrlRegex();

  // Validation functions
  const validateTwitchUrl = (url: string) => {
    if (!url) return true;
    return regexes.twitch.test(url);
  };

  const validateTwitterUrl = (url: string) => {
    if (!url) return true;
    return regexes.twitter.test(url);
  };

  const validateBskyUrl = (url: string) => {
    if (!url) return true;
    return regexes.bsky.test(url);
  };

  const validateYoutubeUrl = (url: string) => {
    if (!url) return true;
    return regexes.youtube.test(url);
  };

  const validateInstagramUrl = (url: string) => {
    if (!url) return true;
    return regexes.instagram.test(url);
  };

  const validateTiktokUrl = (url: string) => {
    if (!url) return true;
    return regexes.tiktok.test(url);
  };

  // Handle adding social media links
  const handleAddTwitch = async () => {
    if (!validateTwitchUrl(twitchUrl())) {
      setTwitchError("Please enter a valid Twitch URL (e.g., https://twitch.tv/username)");
      return;
    }

    try {
      await addSocial("twitch", twitchUrl());
      setTwitchUrl("");
      setTwitchError("");
    } catch (error) {
      setTwitchError(error instanceof Error ? error.message : "Failed to add Twitch URL");
    }
  };

  const handleAddTwitter = async () => {
    if (!validateTwitterUrl(twitterUrl())) {
      setTwitterError("Please enter a valid Twitter/X URL (e.g., https://twitter.com/username or https://x.com/username)");
      return;
    }

    try {
      await addSocial("twitter", twitterUrl());
      setTwitterUrl("");
      setTwitterError("");
    } catch (error) {
      setTwitterError(error instanceof Error ? error.message : "Failed to add Twitter URL");
    }
  };

  const handleAddBsky = async () => {
    if (!validateBskyUrl(bskyUrl())) {
      setBskyError("Please enter a valid Bluesky URL (e.g., https://bsky.app/profile/username.bsky.social, or https://bsky.app/profile/customdomain.com)");
      return;
    }

    try {
      await addSocial("bsky", bskyUrl());
      setBskyUrl("");
      setBskyError("");
    } catch (error) {
      setBskyError(error instanceof Error ? error.message : "Failed to add Bluesky URL");
    }
  };

  const handleAddYoutube = async () => {
    if (!validateYoutubeUrl(youtubeUrl())) {
      setYoutubeError("Please enter a valid YouTube URL (e.g., https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID)");
      return;
    }

    try {
      await addSocial("youtube", youtubeUrl());
      setYoutubeUrl("");
      setYoutubeError("");
    } catch (error) {
      setYoutubeError(error instanceof Error ? error.message : "Failed to add YouTube URL");
    }
  };

  const handleAddInstagram = async () => {
    if (!validateInstagramUrl(instagramUrl())) {
      setInstagramError("Please enter a valid Instagram URL (e.g., https://instagram.com/username)");
      return;
    }

    try {
      await addSocial("instagram", instagramUrl());
      setInstagramUrl("");
      setInstagramError("");
    } catch (error) {
      setInstagramError(error instanceof Error ? error.message : "Failed to add Instagram URL");
    }
  };

  const handleAddTiktok = async () => {
    if (!validateTiktokUrl(tiktokUrl())) {
      setTiktokError("Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)");
      return;
    }

    try {
      await addSocial("tiktok", tiktokUrl());
      setTiktokUrl("");
      setTiktokError("");
    } catch (error) {
      setTiktokError(error instanceof Error ? error.message : "Failed to add TikTok URL");
    }
  };

  // Handle removing social media links
  const handleRemoveSocial = async (provider: string) => {
    try {
      await removeSocial(provider);
    } catch (error) {
      console.error(`Failed to remove ${provider} link:`, error);
    }
  };

  // Handle fetching socials from Tiltify
  const handleFetchSocialsFromTiltify = async () => {
    try {
      await fetchSocialsFromTiltify();
    } catch (error) {
      console.error("Failed to fetch socials from Tiltify:", error);
    }
  };

  // Find existing social media links
  const twitchSocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "twitch")
  );

  const twitterSocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "twitter")
  );

  const bskySocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "bsky")
  );

  const youtubeSocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "youtube")
  );

  const instagramSocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "instagram")
  );

  const tiktokSocial = createMemo(() =>
    local.userSocials.find(s => s.provider === "tiktok")
  );

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Social Media Links</h2>
        <button
          type="button"
          onClick={handleFetchSocialsFromTiltify}
          class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-400 transition-colors"
          disabled={action.fetchSocialsFromTiltify.actionInProgress}
          title="Import social links from Tiltify"
        >
          <FaSolidArrowsRotate
            class={action.fetchSocialsFromTiltify.actionInProgress ? "animate-spin" : ""}
          />
          <span>Import from Tiltify</span>
        </button>
      </div>

      <div class="space-y-6">
        {/* Twitch */}
        <div>
          <h3 class="text-lg font-medium mb-2">Twitch</h3>
          <Show
            when={!twitchSocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={twitchSocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-purple-600 hover:underline"
                >
                  {twitchSocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("twitch")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={twitchUrl()}
                onChange={setTwitchUrl}
                validationState={twitchError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://twitch.tv/username"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTwitch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTwitch}
                    class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    disabled={action.addSocial.actionInProgress || !twitchUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {twitchError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

        {/* YouTube */}
        <div>
          <h3 class="text-lg font-medium mb-2">YouTube</h3>
          <Show
            when={!youtubeSocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={youtubeSocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-red-600 hover:underline"
                >
                  {youtubeSocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("youtube")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={youtubeUrl()}
                onChange={setYoutubeUrl}
                validationState={youtubeError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://youtube.com/@username or https://youtube.com/channel/CHANNEL_ID"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddYoutube();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddYoutube}
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    disabled={action.addSocial.actionInProgress || !youtubeUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {youtubeError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

        {/* Bluesky */}
        <div>
          <h3 class="text-lg font-medium mb-2">Bluesky</h3>
          <Show
            when={!bskySocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={bskySocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sky-500 hover:underline"
                >
                  {bskySocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("bsky")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={bskyUrl()}
                onChange={setBskyUrl}
                validationState={bskyError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://bsky.app/profile/user@domain.com, username.bsky.social, or username.customdomain.com"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBsky();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBsky}
                    class="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                    disabled={action.addSocial.actionInProgress || !bskyUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {bskyError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

        {/* Twitter/X */}
        <div>
          <h3 class="text-lg font-medium mb-2">Twitter</h3>
          <Show
            when={!twitterSocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={twitterSocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-500 hover:underline"
                >
                  {twitterSocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("twitter")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={twitterUrl()}
                onChange={setTwitterUrl}
                validationState={twitterError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://twitter.com/username or https://x.com/username"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTwitter();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTwitter}
                    class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={action.addSocial.actionInProgress || !twitterUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {twitterError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

        {/* TikTok */}
        <div>
          <h3 class="text-lg font-medium mb-2">TikTok</h3>
          <Show
            when={!tiktokSocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={tiktokSocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-black hover:underline"
                >
                  {tiktokSocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("tiktok")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={tiktokUrl()}
                onChange={setTiktokUrl}
                validationState={tiktokError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://tiktok.com/@username"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTiktok();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTiktok}
                    class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    disabled={action.addSocial.actionInProgress || !tiktokUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {tiktokError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

        {/* Instagram */}
        <div>
          <h3 class="text-lg font-medium mb-2">Instagram</h3>
          <Show
            when={!instagramSocial()}
            fallback={
              <div class="flex items-center justify-between p-3 rounded-md">
                <a
                  href={instagramSocial()?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-pink-600 hover:underline"
                >
                  {instagramSocial()?.url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocial("instagram")}
                  class="text-red-500 hover:text-red-700"
                  disabled={action.removeSocial.actionInProgress}
                >
                  <FaSolidTrash />
                </button>
              </div>
            }
          >
            <div class="flex flex-col space-y-2">
              <TextField
                value={instagramUrl()}
                onChange={setInstagramUrl}
                validationState={instagramError() ? "invalid" : "valid"}
              >
                <div class="flex items-center space-x-2">
                  <TextField.Input
                    placeholder="https://instagram.com/username"
                    class="w-full p-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInstagram();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddInstagram}
                    class="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                    disabled={action.addSocial.actionInProgress || !instagramUrl()}
                  >
                    Add
                  </button>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {instagramError()}
                </TextField.ErrorMessage>
              </TextField>
            </div>
          </Show>
        </div>

      </div>
    </div>
  );
};
