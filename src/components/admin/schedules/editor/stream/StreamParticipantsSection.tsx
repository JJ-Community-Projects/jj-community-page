import {type Component, createEffect, createMemo, createSignal, For, Show} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {debounce} from "@solid-primitives/scheduled";
import {FaRegularCircle} from "solid-icons/fa";
import {useScheduleEditor} from "../../../providers/ScheduleEditorProvider.tsx";
import {actions} from "astro:actions";

interface StreamParticipantsSectionProps {
  streamId: string;
}

export const StreamParticipantsSection: Component<StreamParticipantsSectionProps> = (props) => {
  const {
    local,
    addParticipant,
    removeParticipant,
    action
  } = useScheduleEditor();

  // Get the current stream's participants from the local store
  const participants = createMemo(() => {
    const stream = local.streams.find(s => s.id === props.streamId);
    return stream?.participants || [];
  });

  // State for search input and results
  const [searchText, setSearchText] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [error, setError] = createSignal("");

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const {data, error} = await actions.users.search(query);
      if (error) {
        console.error("Search error:", error);
        setError("Failed to search for users");
        setSearchResults([]);
      } else {
        // Filter out users that are already participants
        const filteredResults = data?.filter(user =>
          !participants().some(p => p.userId === user.userId)
        ) || [];
        setSearchResults(filteredResults);
        setError("");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An unexpected error occurred");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  // Handle input change
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  };

  // Handle adding a participant
  const handleAddParticipant = (user: any) => {
    addParticipant(props.streamId, user.userId, user.providerName, user.provider);
    setSearchText("");
    setSearchResults([]);
  };

  // Handle removing a participant
  const handleRemoveParticipant = (userId: number) => {
    removeParticipant(props.streamId, userId);
  };

  return (
    <div class="space-y-3">
      <h3 class="text-sm font-medium">Participants:</h3>

      {/* Search Input */}
      <div class="flex gap-2">
        <TextField
          value={searchText()}
          onChange={handleSearchChange}
        >
          <TextField.Label class="sr-only">Search Users</TextField.Label>
          <div class="relative">
            <TextField.Input
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Search users by username..."
            />
            <Show when={isSearching()}>
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaRegularCircle class="text-blue-500 animate-spin" size={16}/>
              </div>
            </Show>
          </div>
          <Show when={error()}>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {error()}
            </TextField.ErrorMessage>
          </Show>
          <TextField.Description class="text-xs text-gray-500 mt-1">
            Search for users to add as participants in this stream.
          </TextField.Description>
        </TextField>
      </div>

      {/* Search Results */}
      <Show when={searchResults().length > 0}>
        <div class="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          <ul class="divide-y divide-gray-200">
            <For each={searchResults()}>
              {(result) => (
                <li class="p-2 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p class="font-medium">{result.providerName}</p>
                    <p class="text-sm text-gray-500">{result.provider}</p>
                  </div>
                  <button
                    class="text-accent hover:text-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAddParticipant(result)}
                    disabled={action.addParticipant.actionInProgress}
                  >
                    {action.addParticipant.actionInProgress ? 'Adding...' : 'Add'}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      {/* Current Participants */}
      <Show when={participants().length > 0}>
        <div class="mt-2">
          <p class="text-xs text-gray-500 mb-1">Current participants:</p>
          <ul class="divide-y divide-gray-200 border border-gray-200 rounded-md">
            <For each={participants()}>
              {(participant) => (
                <li class="p-2 flex justify-between items-center">
                  <div>
                    <p class="font-medium">{participant.name}</p>
                  </div>
                  <button
                    class="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleRemoveParticipant(participant.userId)}
                    disabled={action.removeParticipant.actionInProgress}
                  >
                    {action.removeParticipant.actionInProgress ? 'Removing...' : 'Remove'}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
};
