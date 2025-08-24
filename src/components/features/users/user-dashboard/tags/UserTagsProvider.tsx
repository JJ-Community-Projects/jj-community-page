import {createContext, createSignal, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {debounce} from "@solid-primitives/scheduled";

const useUserTagsHook = () => {
  const queryClient = useQueryClient();
  const t = orpcPrivate.tags;

  // State for tag search
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");

  // State for category selection
  const [selectedCategoryIds, setSelectedCategoryIds] = createSignal<number[]>([]);

  // Debounced input handler
  const debouncedSetSearchInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 1000);

  // TanStack Queries
  const popularTagsQuery = useQuery(() =>
    t.getPopularTags.queryOptions({
      input: {
        limit: 15,
        timeRange: '30d' as const,
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  );

  const searchQuery = useQuery(() => t.fullTagsSearch.queryOptions({
      input: {
        query: debouncedInput(),
        limit: 15,
        categoryIds: selectedCategoryIds()
      },
      enabled: () => debouncedInput().length > 0,
      staleTime: 30 * 1000,
    })
  );

  const getUserTagsQuery = useQuery(() => t.getUserTags.queryOptions({
    input: {},
    staleTime: 2 * 60 * 1000, // 2 minutes
  }));

  const getTagCategoriesQuery = useQuery(() => t.getTagCategories.queryOptions({
    input: {
      includeEmpty: false, // Only show categories that have tags
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  }));

  // TanStack Mutations
  const addTagMutation = useMutation(() => t.addUserTag.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({queryKey: t.getUserTags.key()});
      },
      onError: (error) => {
        console.error('Failed to add tag:', error);
      }
    })
  );

  const removeTagMutation = useMutation(() => t.removeUserTag.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: t.getUserTags.key()});
    },
    onError: (error) => {
      console.error('Failed to remove tag:', error);
    }
  }));

  // Computed values
  const availableTags = () => {
    const searchTerm = debouncedInput();
    if (searchTerm.length > 0) {
      return searchQuery.data || [];
    }
    return popularTagsQuery.data?.tags || [];
  };

  const userTags = () => getUserTagsQuery.data || [];
  const categories = () => getTagCategoriesQuery.data || [];

  // Loading states
  const isLoadingTags = () => popularTagsQuery.isLoading ||
    searchQuery.isLoading ||
    addTagMutation.isPending ||
    removeTagMutation.isPending;

  const isLoadingCategories = () => getTagCategoriesQuery.isLoading;
  const isLoadingUserTags = () => getUserTagsQuery.isLoading || addTagMutation.isPending || removeTagMutation.isPending;

  // Error states
  const hasTagsError = () => !!popularTagsQuery.error ||
    !!searchQuery.error ||
    !!addTagMutation.error ||
    !!removeTagMutation.error;

  const hasCategoriesError = () => !!getTagCategoriesQuery.error;
  const hasUserTagsError = () => !!(getUserTagsQuery.error || addTagMutation.error || removeTagMutation.error);

  // Event handlers
  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTagMutation.mutateAsync({tagId});
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  const handleSelectTag = async (event: Event, tagId: number) => {
    event.preventDefault();
    event.stopPropagation();

    if (!userTags().some(ut => ut.tagId === tagId)) {
      try {
        await addTagMutation.mutateAsync({tagId});
        setSearchInput("");
        setDebouncedInput("");
      } catch (error) {
        console.error("Error adding tag:", error);
      }
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Error messages
  const availableTagsError = () => {
    return popularTagsQuery.error?.message ||
      searchQuery.error?.message ||
      "Unknown error";
  };

  const userTagsError = () => {
    return getUserTagsQuery.error?.message ||
      addTagMutation.error?.message ||
      removeTagMutation.error?.message;
  };

  const categoriesError = () => {
    return getTagCategoriesQuery.error?.message || "Unknown error";
  };

  return {
    // State
    searchInput,
    setSearchInput,
    debouncedInput,
    selectedCategoryIds,

    // Computed data
    availableTags,
    userTags,
    categories,

    // Loading states
    isLoadingTags,
    isLoadingCategories,
    isLoadingUserTags,

    // Error states
    hasTagsError,
    hasCategoriesError,
    hasUserTagsError,

    // Error messages
    availableTagsError,
    userTagsError,
    categoriesError,

    // Event handlers
    handleRemoveTag,
    handleSelectTag,
    handleSearchInput,
    handleToggleCategory,
  };
}

interface UserTagsProps {
}

const UserTagsContext = createContext<ReturnType<typeof useUserTagsHook>>();

export const UserTagsProvider: ParentComponent<UserTagsProps> = (props) => {
  const hook = useUserTagsHook()
  return (
    <UserTagsContext.Provider value={hook}>
      {props.children}
    </UserTagsContext.Provider>
  );
}
export const useTags = () => useContext(UserTagsContext)!
