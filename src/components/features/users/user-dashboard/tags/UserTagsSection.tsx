import {type Component, createSignal, For, Match, Switch} from "solid-js";
import {TextField} from "@kobalte/core/text-field";
import {Accordion} from "@kobalte/core/accordion";
import {debounce} from "@solid-primitives/scheduled";
import {FaRegularCircle} from "solid-icons/fa";
import "./UserTagsSection.css";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";

// Type definitions for component props
interface TagExplanationAccordionProps {
  defaultExpanded?: boolean;
}

interface TagSearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

interface AvailableTagsListProps {
  tags: any[];
  userTags: any[];
  isLoading: boolean;
  hasError: boolean;
  searchTerm: string;
  onSelectTag: (event: Event, tagId: number) => Promise<void>;
  errorMessage?: string;
}

interface UserTagsListProps {
  userTags: any[];
  isLoading: boolean;
  hasError: boolean;
  onRemoveTag: (tagId: number) => Promise<void>;
  errorMessage?: string;
}

interface TagCategorySelectionProps {
  categories: any[];
  selectedCategoryIds: number[];
  isLoading: boolean;
  hasError: boolean;
  onToggleCategory: (categoryId: number) => void;
  errorMessage?: string;
}

/**
 * TagExplanationAccordion Component
 *
 * Displays explanation about user tags in a collapsible accordion format.
 */
const TagExplanationAccordion: Component<TagExplanationAccordionProps> = (props) => {
  return (
    <Accordion class="mb-4" collapsible={true} defaultValue={props.defaultExpanded ? ["explanation"] : []}>
      <Accordion.Item value="explanation" class="border border-gray-200 rounded-lg">
        <Accordion.Header>
          <Accordion.Trigger
            class="flex justify-between items-center w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
            <span>About User Tags</span>
            <svg
              class="w-5 h-5 transform transition-transform duration-200 accordion__item-trigger-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content class="px-4 pt-0 pb-2 text-sm text-gray-600">
          <div class="pt-2">
            <p>Tags help others discover streamers with similar interests and causes. Choose from available tags to show
              off
              your favorite games, hobbies, or communities — and don't forget to add a charity tag to highlight the
              cause you're fundraising for.</p>
            <p class="mt-2">This makes it easier for viewers to connect with you and support the charity you care
              about most.</p>
            <p class="mt-2">You can pick from popular tags or search for specific ones that match your interests.
              The more relevant your tags, the easier it is for viewers to connect with you and support your stream.</p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
};

/**
 * TagCategorySelection Component
 *
 * Displays available tag categories with selection functionality for filtering.
 */
const TagCategorySelection: Component<TagCategorySelectionProps> = (props) => {
  const hasCategories = () => props.categories.length > 0;

  return (
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <p class="text-sm font-medium text-gray-700">Filter by Category:</p>

        {/* State indicator for category fetch */}
        <div class="flex items-center gap-1">
          <Switch>
            <Match when={props.isLoading}>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                <FaRegularCircle class="inline mr-1 text-blue-500 animate-ping" size={8}/>
                Loading
              </span>
            </Match>
            <Match when={props.hasError}>
              <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                Error
              </span>
            </Match>
            <Match when={!props.isLoading && !props.hasError}>
              <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Ready
              </span>
            </Match>
          </Switch>
        </div>
      </div>

      {/* Category selection display */}
      <Switch fallback={
        <div class="flex flex-wrap gap-2 min-h-[28px]">
          <p class="text-xs text-gray-500">No categories available.</p>
        </div>
      }>
        {/* Error state */}
        <Match when={props.hasError}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            <p class="text-xs text-red-500 mb-1">Error loading categories: {props.errorMessage || "Unknown error"}</p>
          </div>
        </Match>

        {/* Loading state */}
        <Match when={props.isLoading && !hasCategories()}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            <p class="text-xs text-gray-500">Loading categories...</p>
          </div>
        </Match>

        {/* Data state */}
        <Match when={hasCategories()}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            {/* Available categories */}
            <For each={props.categories}>
              {(category) => {
                const isSelected = () => props.selectedCategoryIds.includes(category.id);
                return (
                  <button
                    type="button"
                    onClick={() => props.onToggleCategory(category.id)}
                    class={`text-xs px-2 py-1 rounded-full transition-all border ${
                      isSelected()
                        ? 'text-white border-transparent'
                        : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    style={isSelected() ? {'background-color': category.color} : {}}
                  >
                    {category.name} ({category.tagCount})
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

/**
 * TagSearchInput Component
 *
 * Provides a search input field for finding tags with debounced input handling.
 */
const TagSearchInput: Component<TagSearchInputProps> = (props) => {
  return (
    <div class="mb-4">
      <TextField
        name="searchInput"
        value={props.value}
        onChange={props.onSearch}
      >
        <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Search Tags</TextField.Label>
        <TextField.Input
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder={props.placeholder || "Search for tags..."}
        />
        <TextField.Description class="mt-1 text-sm text-gray-500">
          Search for tags to add to your profile.
        </TextField.Description>
      </TextField>
    </div>
  );
};

/**
 * AvailableTagsList Component
 *
 * Displays available tags (popular or search results) with selection functionality.
 */
const AvailableTagsList: Component<AvailableTagsListProps> = (props) => {
  const hasTags = () => props.tags.length > 0;

  return (
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <p class="text-sm font-medium text-gray-700">
          {props.searchTerm.length > 0 ? 'Search Results:' : 'Popular Tags:'}
        </p>

        {/* State indicator for fetch process */}
        <div class="flex items-center gap-1">
          <Switch>
            <Match when={props.isLoading}>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                <FaRegularCircle class="inline mr-1 text-blue-500 animate-ping" size={8}/>
                Loading
              </span>
            </Match>
            <Match when={props.hasError}>
              <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                Error
              </span>
            </Match>
            <Match when={!props.isLoading && !props.hasError}>
              <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Ready
              </span>
            </Match>
          </Switch>
        </div>
      </div>

      {/* Use Switch/Match to show the state of the fetch process */}
      <Switch fallback={
        <div class="flex flex-wrap gap-2 min-h-[28px]">
          <p class="text-xs text-gray-500">No tags available.</p>
        </div>
      }>
        {/* Error state */}
        <Match when={props.hasError}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            <p class="text-xs text-red-500 mb-1">Error loading tags: {props.errorMessage || "Unknown error"}</p>
          </div>
        </Match>

        {/* Loading state */}
        <Match when={props.isLoading && !hasTags()}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            <p class="text-xs text-gray-500">Loading tags...</p>
          </div>
        </Match>

        {/* Data state */}
        <Match when={hasTags()}>
          <div class="flex flex-wrap gap-2 min-h-[28px]">
            {/* Available tags */}
            <For each={props.tags}>
              {(tag) => {
                const userHasTag = props.userTags.some(ut => ut.tagId === tag.id);
                return (
                  <button
                    type="button"
                    onClick={(e) => props.onSelectTag(e, tag.id)}
                    disabled={userHasTag}
                    class={`text-xs px-2 py-1 rounded-full transition-all ${
                      userHasTag
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'text-white bg-accent-200 hover:bg-accent-300'
                    }`}
                    style={!userHasTag ? {'background-color': tag.color} : {}}
                  >
                    {tag.name} ({tag.totalUsage})
                  </button>
                );
              }}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

/**
 * UserTagsList Component
 *
 * Displays the user's current tags with removal functionality.
 */
const UserTagsList: Component<UserTagsListProps> = (props) => {
  return (
    <div class="mt-4">
      <p class="text-sm font-medium text-gray-700 mb-2">Your Tags:</p>
      <Switch>
        <Match when={props.isLoading}>
          <div class="flex justify-center items-center p-4">
            <p class="text-gray-500">Loading...</p>
          </div>
        </Match>

        <Match when={props.hasError}>
          <div class="flex justify-center items-center p-4">
            <p class="text-red-500">Error: {props.errorMessage}</p>
          </div>
        </Match>

        <Match when={props.userTags.length === 0}>
          <div class="flex justify-center items-center p-4">
            <p class="text-gray-500">No tags added yet. Click on an available tag above to add your first tag.</p>
          </div>
        </Match>

        <Match when={props.userTags.length > 0}>
          <div class="flex flex-wrap gap-2">
            <For each={props.userTags}>
              {(userTag) => (
                <div
                  class="flex items-center bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm"
                  style={{'background-color': `${userTag.tag.color}20`, color: userTag.tag.color}}
                >
                  {userTag.tag.name}
                  <button
                    type="button"
                    onClick={() => props.onRemoveTag(userTag.tagId)}
                    class="ml-2 hover:opacity-70"
                    style={{color: userTag.tag.color}}
                    aria-label={`Remove tag ${userTag.tag.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

/**
 * UserTagsSection Component
 *
 * Allows normal users to manage their tag associations by selecting from admin-created tags.
 * Users can search for tags, view popular tags, and add/remove tags from their profile.
 *
 * Features:
 * - Browse popular admin-created tags
 * - Search for specific tags by name
 * - Add tags to user profile (limited to existing admin tags)
 * - Remove tags from user profile
 * - Visual feedback showing which tags are already selected
 *
 * Note: Custom tag creation is no longer allowed for normal users.
 * Only administrators can create new tags through the admin interface.
 */
export const UserTagsSection: Component = () => {
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

  const isLoadingTags = () => popularTagsQuery.isLoading ||
    searchQuery.isLoading ||
    addTagMutation.isPending ||
    removeTagMutation.isPending;

  const isLoadingCategories = () => getTagCategoriesQuery.isLoading;

  const hasTagsError = () => !!popularTagsQuery.error ||
    !!searchQuery.error ||
    !!addTagMutation.error ||
    !!removeTagMutation.error;

  const hasCategoriesError = () => !!getTagCategoriesQuery.error;

  // Handle removing a tag
  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTagMutation.mutateAsync({tagId});
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  // Handle selecting a suggested tag
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

  // Handle search input with debouncing
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };

  // Handle category selection toggle
  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Computed error messages
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

  return (
    <div class="bg-white p-6">
      {/* Explanation text in accordion */}
      <TagExplanationAccordion/>

      {/* Category Selection */}
      <TagCategorySelection
        categories={categories()}
        selectedCategoryIds={selectedCategoryIds()}
        isLoading={isLoadingCategories()}
        hasError={hasCategoriesError()}
        onToggleCategory={handleToggleCategory}
        errorMessage={categoriesError()}
      />

      {/* Tag Search Input */}
      <TagSearchInput
        value={searchInput()}
        onSearch={handleSearchInput}
        placeholder="Search for tags..."
      />

      {/* Available Tags */}
      <AvailableTagsList
        tags={availableTags()}
        userTags={userTags()}
        isLoading={isLoadingTags()}
        hasError={hasTagsError()}
        searchTerm={debouncedInput()}
        onSelectTag={handleSelectTag}
        errorMessage={availableTagsError()}
      />

      {/* Current Tags */}
      <UserTagsList
        userTags={userTags()}
        isLoading={getUserTagsQuery.isLoading || addTagMutation.isPending || removeTagMutation.isPending}
        hasError={!!(getUserTagsQuery.error || addTagMutation.error || removeTagMutation.error)}
        onRemoveTag={handleRemoveTag}
        errorMessage={userTagsError()}
      />
    </div>
  );
};
