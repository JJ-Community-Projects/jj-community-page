import { createContext, type ParentComponent, useContext } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../lib/orpc/client.ts'
import { useTagSearch } from '../../../../../lib/useTagSearch.ts'

const useUserTagsHook = () => {
  const queryClient = useQueryClient()
  const t = orpcPrivate.tags
  const tagSearch = useTagSearch()

  const canAddTagToUser = useQuery(() => t.canAddTagToUser.queryOptions())

  const getUserTagsQuery = useQuery(() =>
    t.getUserTags.queryOptions({
      input: {},
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
  )

  const getTagCategoriesQuery = useQuery(() =>
    t.getTagCategories.queryOptions({
      input: {
        includeEmpty: false, // Only show categories that have tags
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    }),
  )

  // TanStack Mutations
  const addTagMutation = useMutation(() =>
    t.addUserTag.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: t.getUserTags.key() })
        await queryClient.invalidateQueries({
          queryKey: t.canAddTagToUser.key(),
        })
      },
      onError: (error) => {
        console.error('Failed to add tag:', error)
      },
    }),
  )

  const removeTagMutation = useMutation(() =>
    t.removeUserTag.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: t.getUserTags.key() })
      },
      onError: (error) => {
        console.error('Failed to remove tag:', error)
      },
    }),
  )

  // Computed values
  const availableTags = () => {
    const searchTerm = tagSearch.debouncedInput()
    if (searchTerm.length > 0) {
      return tagSearch.searchQuery.data || []
    }
    return tagSearch.popularTagsQuery.data?.tags || []
  }

  const userTags = () => getUserTagsQuery.data || []
  const categories = () => getTagCategoriesQuery.data || []

  // Loading states
  const isLoadingTags = () =>
    tagSearch.popularTagsQuery.isLoading ||
    tagSearch.searchQuery.isLoading ||
    addTagMutation.isPending ||
    removeTagMutation.isPending

  const isLoadingCategories = () => getTagCategoriesQuery.isLoading
  const isLoadingUserTags = () =>
    getUserTagsQuery.isLoading ||
    addTagMutation.isPending ||
    removeTagMutation.isPending

  // Error states
  const hasTagsError = () =>
    !!tagSearch.popularTagsQuery.error ||
    !!tagSearch.searchQuery.error ||
    !!addTagMutation.error ||
    !!removeTagMutation.error

  const hasCategoriesError = () => !!getTagCategoriesQuery.error
  const hasUserTagsError = () =>
    !!(
      getUserTagsQuery.error ||
      addTagMutation.error ||
      removeTagMutation.error
    )

  const canAddTag = () => canAddTagToUser.data?.canAdd || false

  // Event handlers
  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTagMutation.mutateAsync({ tagId })
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }

  const handleSelectTag = async (event: Event, tagId: number) => {
    event.preventDefault()
    event.stopPropagation()

    if (!userTags().some((ut) => ut.tagId === tagId)) {
      try {
        await addTagMutation.mutateAsync({ tagId })
        tagSearch.handleSearchInput('')
      } catch (error) {
        console.error('Error adding tag:', error)
      }
    }
  }

  const handleSearchInput = (value: string) => {
    tagSearch.handleSearchInput(value)
  }

  const handleToggleCategory = (categoryId: number) => {
    tagSearch.setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // Error messages
  const availableTagsError = () => {
    return (
      tagSearch.popularTagsQuery.error?.message ||
      tagSearch.searchQuery.error?.message ||
      'Unknown error'
    )
  }

  const userTagsError = () => {
    return (
      getUserTagsQuery.error?.message ||
      addTagMutation.error?.message ||
      removeTagMutation.error?.message
    )
  }

  const categoriesError = () => {
    return getTagCategoriesQuery.error?.message || 'Unknown error'
  }

  return {
    // State
    searchInput: tagSearch.searchInput,
    // setSearchInput: handleSearchInput,
    debouncedInput: tagSearch.debouncedInput,
    selectedCategoryIds: tagSearch.selectedCategoryIds,

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

    canAddTag,
    canAddTagToUser,
  }
}

interface UserTagsProps {}

const UserTagsContext = createContext<ReturnType<typeof useUserTagsHook>>()

export const UserTagsProvider: ParentComponent<UserTagsProps> = (props) => {
  const hook = useUserTagsHook()
  return (
    <UserTagsContext.Provider value={hook}>
      {props.children}
    </UserTagsContext.Provider>
  )
}
export const useTags = () => useContext(UserTagsContext)!
