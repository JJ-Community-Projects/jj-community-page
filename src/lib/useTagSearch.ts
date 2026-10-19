import {createSignal} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {useQuery} from "@tanstack/solid-query";
import {type CatalogTag, popularTags as rankPopular, searchTags, TAG_CATALOG_URL} from "./tagCatalog.ts";

type UseTagSearchOptions = {
  debounceMs?: number;
  limit?: number;
  initialSelectedCategoryIds?: number[];
  catalogStaleTime?: number;
};

// The public tag catalog (one cached GET for everybody, logged in or not); popular tags and
// search results are computed from it in the browser, so typing sends no requests.
// `/api/public` is an OpenAPI handler, which the `orpcPublic` (RPCLink) client cannot talk to.
async function fetchTagCatalog(): Promise<CatalogTag[]> {
  const res = await fetch(TAG_CATALOG_URL);
  if (!res.ok) throw new Error(`Failed to load tags (${res.status})`);
  return ((await res.json()) as { tags: CatalogTag[] }).tags;
}

export function useTagSearch(opts: UseTagSearchOptions = {}) {
  const {
    debounceMs = 1000,
    limit = 15,
    initialSelectedCategoryIds = [],
    catalogStaleTime = 5 * 60 * 1000,
  } = opts;

  // State
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [selectedCategoryIds, setSelectedCategoryIds] = createSignal<number[]>(initialSelectedCategoryIds);

  // Debounce
  const debouncedSetSearchInput = debounce((value: string) => setDebouncedInput(value), debounceMs);

  // Queries
  const catalogQuery = useQuery(() => ({
    queryKey: ["tags", "catalog"],
    queryFn: fetchTagCatalog,
    staleTime: catalogStaleTime,
  }));

  // Derived
  const catalog = () => catalogQuery.data ?? [];
  const popularTags = () => rankPopular(catalog(), limit);
  const availableTags = () => {
    const q = debouncedInput();
    if (q.length > 0) return searchTags(catalog(), q, limit);
    return popularTags();
  };

  // Handlers
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => (prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]));
  };

  // Status
  const isLoadingTags = () => catalogQuery.isLoading;
  const hasTagsError = () => !!catalogQuery.error;
  const availableTagsError = () => catalogQuery.error?.message || "Unknown error";

  return {
    // state
    searchInput,
    debouncedInput,
    selectedCategoryIds,

    // handlers
    handleSearchInput,
    handleToggleCategory,
    setSelectedCategoryIds,

    // data
    availableTags,
    popularTags,

    // status
    isLoadingTags,
    hasTagsError,
    availableTagsError,

    // queries (optional)
    catalogQuery,
  } as const;
}
