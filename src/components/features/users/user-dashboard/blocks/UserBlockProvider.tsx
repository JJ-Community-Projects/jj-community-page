import {createContext, createSignal, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {debounce} from "@solid-primitives/scheduled";

const useUserBlockHook = () => {
  const queryClient = useQueryClient();
  const blocking = orpcPrivate.blocking;
  const users = orpcPrivate.users;

  // State for user search
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedInput, setDebouncedInput] = createSignal("");

  // Debounced input handler
  const debouncedSetSearchInput = debounce((value: string) => {
    setDebouncedInput(value);
  }, 500); // 500ms delay for user search

  // TanStack Queries

  // User search query for finding users to block
  const userSearchQuery = useQuery(() => users.searchByName.queryOptions({
    input: {
      searchTerm: debouncedInput()
    },
    enabled: () => debouncedInput().length > 0,
    staleTime: 30 * 1000, // 30 seconds
  }));

  // List of blocked users query
  const blockedUsersQuery = useQuery(() => blocking.listBlockedUsers.queryOptions({
    staleTime: 30 * 1000, // 30 seconds
  }));

  // TanStack Mutations

  // Block user mutation
  const blockUserMutation = useMutation(() =>
    blocking.blockUser.mutationOptions({
      onSuccess: async () => {
        // Refresh both blocked users list and search results
        await queryClient.invalidateQueries({queryKey: blocking.listBlockedUsers.key()});
        await queryClient.invalidateQueries({queryKey: users.searchByName.key()});
        // Clear search after successful block
        setSearchInput("");
        setDebouncedInput("");
      },
      onError: (error) => {
        console.error('Failed to block user:', error);
      }
    })
  );

  // Unblock user mutation
  const unblockUserMutation = useMutation(() =>
    blocking.unblockUser.mutationOptions({
      onSuccess: async () => {
        // Refresh blocked users list
        await queryClient.invalidateQueries({queryKey: blocking.listBlockedUsers.key()});
      },
      onError: (error) => {
        console.error('Failed to unblock user:', error);
      }
    })
  );

  // Computed values
  const searchResults = () => userSearchQuery.data ?? [];
  const blockedUsers = () => blockedUsersQuery.data ?? [];

  // Loading states
  const isLoadingSearch = () => userSearchQuery.isLoading;
  const isLoadingBlockedUsers = () => blockedUsersQuery.isLoading;

  // Mutation loading states
  const isBlockingUser = () => blockUserMutation.isPending;
  const isUnblockingUser = () => unblockUserMutation.isPending;

  // Error states
  const hasSearchError = () => !!userSearchQuery.error;
  const hasBlockedUsersError = () => !!blockedUsersQuery.error;

  // Mutation error states
  const hasBlockError = () => !!blockUserMutation.error;
  const hasUnblockError = () => !!unblockUserMutation.error;

  // Event handlers
  const handleBlockUser = async (blockedUserId: number) => {
    try {
      await blockUserMutation.mutateAsync({
        blockedUserId
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
      throw error;
    }
  };

  const handleUnblockUser = async (blockedUserId: number) => {
    try {
      await unblockUserMutation.mutateAsync({
        blockedUserId
      });
    } catch (error) {
      throw error;
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    debouncedSetSearchInput(value);
  };

  // Error message helpers
  const searchErrorMessage = () => userSearchQuery.error?.message || 'Failed to search users';
  const blockedUsersErrorMessage = () => blockedUsersQuery.error?.message || 'Failed to load blocked users';

  // Mutation error message helpers
  const blockErrorMessage = () => blockUserMutation.error?.message || 'Failed to block user';
  const unblockErrorMessage = () => unblockUserMutation.error?.message || 'Failed to unblock user';

  return {
    // State
    searchInput,
    debouncedInput,

    // Computed data
    searchResults,
    blockedUsers,

    // Loading states
    isLoadingSearch,
    isLoadingBlockedUsers,

    // Mutation loading states
    isBlockingUser,
    isUnblockingUser,

    // Error states
    hasSearchError,
    hasBlockedUsersError,
    hasBlockError,
    hasUnblockError,

    // Error messages
    searchErrorMessage,
    blockedUsersErrorMessage,
    blockErrorMessage,
    unblockErrorMessage,

    // Event handlers
    handleBlockUser,
    handleUnblockUser,
    handleSearchInput,
  };
}

interface UserBlockProps {
}

const UserBlockContext = createContext<ReturnType<typeof useUserBlockHook>>();

export const UserBlockProvider: ParentComponent<UserBlockProps> = (props) => {
  const hook = useUserBlockHook()
  return (
    <UserBlockContext.Provider value={hook}>
      {props.children}
    </UserBlockContext.Provider>
  );
}

export const useBlocks = () => useContext(UserBlockContext)!
