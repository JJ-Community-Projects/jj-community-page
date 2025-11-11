import {createSignal} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "./orpc/client.ts";

type UseTagSearchOptions = {
  debounceMs?: number;
  limit?: number;
  timeRange?: "7d" | "30d" | "90d";
  includeEmptyCategories?: boolean;
  initialSelectedCategoryIds?: number[];
  popularStaleTime?: number;
  popularGcTime?: number;
  searchStaleTime?: number;
  categoriesStaleTime?: number;
};

export function useTagSearch(opts: UseTagSearchOptions = {}) {
  const t = orpcPrivate.tags;

  const {
    debounceMs = 1000,
    limit = 15,
    timeRange = "30d",
    includeEmptyCategories = false,
    initialSelectedCategoryIds = [],
    popularStaleTime = 5 * 60 * 1000,
    popularGcTime = 10 * 60 * 1000,
    searchStaleTime = 30 * 1000,
    categoriesStaleTime = 10 * 60 * 1000,
  } = opts;

  // State
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [selectedCategoryIds, setSelectedCategoryIds] = createSignal<number[]>(initialSelectedCategoryIds);

  // Debounce
  const debouncedSetSearchInput = debounce((value: string) => setDebouncedInput(value), debounceMs);

  // Queries
  const popularTagsQuery = useQuery(() =>
    t.getPopularTags.queryOptions({
      input: { limit, timeRange },
      staleTime: popularStaleTime,
      gcTime: popularGcTime,
    })
  );

  const searchQuery = useQuery(() =>
    t.fullTagsSearch.queryOptions({
      input: {
        query: debouncedInput(),
        limit,
      },
      enabled: () => debouncedInput().length > 0,
      staleTime: searchStaleTime,
    })
  );

  const getTagCategoriesQuery = useQuery(() =>
    t.getTagCategories.queryOptions({
      input: { includeEmpty: includeEmptyCategories },
      staleTime: categoriesStaleTime,
    })
  );

  // Derived
  const availableTags = () => {
    const q = debouncedInput();
    if (q.length > 0) return searchQuery.data || [];
    return popularTagsQuery.data?.tags || [];
  };
  const categories = () => getTagCategoriesQuery.data || [];

  // Handlers
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => (prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]));
  };

  // Status
  const isLoadingTags = () => popularTagsQuery.isLoading || searchQuery.isLoading;
  const isLoadingCategories = () => getTagCategoriesQuery.isLoading;

  const hasTagsError = () => !!popularTagsQuery.error || !!searchQuery.error;
  const hasCategoriesError = () => !!getTagCategoriesQuery.error;

  const availableTagsError = () =>
    popularTagsQuery.error?.message || searchQuery.error?.message || "Unknown error";
  const categoriesError = () => getTagCategoriesQuery.error?.message || "Unknown error";

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
    categories,

    // status
    isLoadingTags,
    isLoadingCategories,
    hasTagsError,
    hasCategoriesError,
    availableTagsError,
    categoriesError,

    // queries (optional)
    popularTagsQuery,
    searchQuery,
    getTagCategoriesQuery,
  } as const;
}
