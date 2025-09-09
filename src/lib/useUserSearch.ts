import {createSignal} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "./orpc/client.ts";

export type UseUserSearchOptions = {
  debounceMs?: number;
  staleTime?: number;
};

export function useUserSearch(opts: UseUserSearchOptions = {}) {
  const { debounceMs = 500, staleTime = 30 * 1000 } = opts;
  const users = orpcPrivate.users;

  // State
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");

  // Debounce
  const debouncedSetSearchInput = debounce((value: string) => setDebouncedInput(value), debounceMs);

  // Query
  const searchQuery = useQuery(() =>
    users.searchByName.queryOptions({
      input: { searchTerm: debouncedInput() },
      enabled: () => debouncedInput().length > 0,
      staleTime,
    })
  );

  // Data
  const results = () => searchQuery.data ?? [];

  // Handlers
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };
  const clear = () => {
    setSearchInput("");
    setDebouncedInput("");
  };

  // Status & errors
  const isLoading = () => searchQuery.isLoading;
  const hasError = () => !!searchQuery.error;
  const errorMessage = () => searchQuery.error?.message || "Failed to search users";

  return {
    // state
    searchInput,
    debouncedInput,

    // handlers
    handleSearchInput,
    clear,

    // data
    results,

    // status
    isLoading,
    hasError,
    errorMessage,

    // query (optional)
    searchQuery,
  } as const;
}
