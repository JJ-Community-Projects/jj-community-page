import {createContext, createSignal, useContext} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {type CatalogTag, popularTags as rankPopular, searchTags} from "./tagCatalog.ts";

type UseTagSearchOptions = {
  debounceMs?: number;
  limit?: number;
  initialSelectedCategoryIds?: number[];
};

/**
 * The tag catalog (`public.tags.catalog`), loaded in-process in the page's frontmatter and passed
 * to the island as a prop; `undefined` when the page couldn't load it. Popular tags and
 * search results are computed from it in the browser, so typing sends no requests.
 */
export const TagCatalogContext = createContext<CatalogTag[] | undefined>();

export function useTagSearch(opts: UseTagSearchOptions = {}) {
  const {
    debounceMs = 1000,
    limit = 15,
    initialSelectedCategoryIds = [],
  } = opts;

  // State
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");
  const [selectedCategoryIds, setSelectedCategoryIds] = createSignal<number[]>(initialSelectedCategoryIds);

  // Debounce
  const debouncedSetSearchInput = debounce((value: string) => setDebouncedInput(value), debounceMs);

  const pageCatalog = useContext(TagCatalogContext);

  // Derived
  const catalog = () => pageCatalog ?? [];
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
  const isLoadingTags = () => false;
  const hasTagsError = () => pageCatalog === undefined;
  const availableTagsError = () => "Failed to load tags";

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
  } as const;
}
