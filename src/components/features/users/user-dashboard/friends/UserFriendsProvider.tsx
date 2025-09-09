import {createContext, createEffect, on, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {useUserSearch} from "../../../../../lib/useUserSearch";

const useUserFriendsHook = () => {
  const queryClient = useQueryClient();
  const friends = orpcPrivate.friends;
  // User search via shared hook
  const userSearch = useUserSearch();
  const searchInput = userSearch.searchInput;
  const debouncedInput = userSearch.debouncedInput;

  // TanStack Queries

  const friendsWS = orpcPrivate.friendsWS;
  // Real-time friend requests using WS
  const friendRequestsQuery = useQuery(() =>
    friendsWS.getUserFriendRequestsWS.experimental_liveOptions({
      staleTime: 30 * 1000, // 30 seconds
    })
  );

  // Real-time sent friend requests using WS
  const sentFriendRequestsQuery = useQuery(() =>
    friendsWS.getSendUserFriendRequestsWS.experimental_liveOptions({
      staleTime: 30 * 1000, // 30 seconds
    })
  );

  createEffect(on(() => sentFriendRequestsQuery.data, (data)=> {
    console.log('sentFriendRequestsQuery.data',data);
  }))
  createEffect(on(() => sentFriendRequestsQuery.error, (data)=> {
    console.error('sentFriendRequestsQuery.error',data);
  }))

  // Real-time friends list using WS
  const friendsListQuery = useQuery(() =>
    friendsWS.getUserFriendsWS.experimental_liveOptions({
      staleTime: 30 * 1000, // 30 seconds
    })
  );


  /*
    const friendsSSE = orpcPrivate.friendsSSE;
    // Real-time friend requests using SSE
    const friendRequestsQuery = useQuery(() =>
      friendsSSE.getUserFriendRequestsSSE.experimental_liveOptions({
        staleTime: 30 * 1000, // 30 seconds
      })
    );

    // Real-time sent friend requests using SSE
    const sentFriendRequestsQuery = useQuery(() =>
      friendsSSE.getSendUserFriendRequestsSSE.experimental_liveOptions({
        staleTime: 30 * 1000, // 30 seconds
      })
    );

    // Real-time friends list using SSE
    const friendsListQuery = useQuery(() =>
      friendsSSE.getUserFriendsSSE.experimental_liveOptions({
        staleTime: 30 * 1000, // 30 seconds
      })
    );
    */


  // TanStack Mutations

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation(() =>
    friends.sendFriendRequest.mutationOptions({
      onSuccess: () => {
        // Clear search after successful friend request
        userSearch.clear();
        // SSE will automatically update the UI, no need to invalidate queries
      },
      onError: (error) => {
        console.error('Failed to send friend request:', error);
      }
    })
  );

  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation(() =>
    friends.acceptFriendRequest.mutationOptions({
      onSuccess: () => {
        // SSE will automatically update both friend requests and friends list
      },
      onError: (error) => {
        console.error('Failed to accept friend request:', error);
      }
    })
  );

  // Decline friend request mutation
  const declineFriendRequestMutation = useMutation(() =>
    friends.declineFriendRequest.mutationOptions({
      onSuccess: () => {
        // SSE will automatically update friend requests list
      },
      onError: (error) => {
        console.error('Failed to decline friend request:', error);
      }
    })
  );

  // Cancel sent friend request mutation
  const cancelFriendRequestMutation = useMutation(() =>
    friends.cancelFriendRequest.mutationOptions({
      onSuccess: () => {
        // SSE will automatically update sent friend requests list
      },
      onError: (error) => {
        console.error('Failed to cancel friend request:', error);
      }
    })
  );

  // Remove friend mutation (unfriend)
  const removeFriendMutation = useMutation(() =>
    friends.removeFriend.mutationOptions({
      onSuccess: () => {
        // SSE will automatically update friends list
      },
      onError: (error) => {
        console.error('Failed to remove friend:', error);
      }
    })
  );

  // Computed values
  const searchResults = () => userSearch.results();
  const friendRequests = () => friendRequestsQuery.data?.users || [];
  const sentFriendRequests = () => sentFriendRequestsQuery.data?.users || [];
  const friendsList = () => friendsListQuery.data?.friends || [];

  // Loading states
  const isLoadingSearch = () => userSearch.isLoading();
  const isLoadingFriendRequests = () => friendRequestsQuery.isLoading;
  const isLoadingSentFriendRequests = () => sentFriendRequestsQuery.isLoading;
  const isLoadingFriends = () => friendsListQuery.isLoading;

  // Mutation loading states
  const isSendingFriendRequest = () => sendFriendRequestMutation.isPending;
  const isAcceptingFriendRequest = () => acceptFriendRequestMutation.isPending;
  const isDecliningFriendRequest = () => declineFriendRequestMutation.isPending;
  const isCancellingFriendRequest = () => cancelFriendRequestMutation.isPending;
  const isRemovingFriend = () => removeFriendMutation.isPending;

  // Error states
  const hasSearchError = () => userSearch.hasError();
  const hasFriendRequestsError = () => !!friendRequestsQuery.error;
  const hasSentFriendRequestsError = () => !!sentFriendRequestsQuery.error;
  const hasFriendsError = () => !!friendsListQuery.error;

  // Mutation error states
  const hasSendFriendRequestError = () => !!sendFriendRequestMutation.error;
  const hasAcceptFriendRequestError = () => !!acceptFriendRequestMutation.error;
  const hasDeclineFriendRequestError = () => !!declineFriendRequestMutation.error;
  const hasCancelFriendRequestError = () => !!cancelFriendRequestMutation.error;
  const hasRemoveFriendError = () => !!removeFriendMutation.error;

  // Event handlers
  const handleSendFriendRequest = async (toUserId: number) => {
    try {
      await sendFriendRequestMutation.mutateAsync({
        toUserId
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
      throw error;
    }
  };

  const handleAcceptFriendRequest = async (fromUserId: number) => {
    try {
      await acceptFriendRequestMutation.mutateAsync({
        fromUserId
      });
    } catch (error) {
      throw error;
    }
  };

  const handleDeclineFriendRequest = async (fromUserId: number) => {
    try {
      await declineFriendRequestMutation.mutateAsync({
        fromUserId
      });
    } catch (error) {
      throw error;
    }
  };

  const handleCancelFriendRequest = async (toUserId: number) => {
    try {
      await cancelFriendRequestMutation.mutateAsync({
        toUserId: toUserId
      });
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveFriend = async (friendUserId: number) => {
    try {
      await removeFriendMutation.mutateAsync({
        friendUserId
      });
    } catch (error) {
      throw error;
    }
  };

  const handleSearchInput = (value: string) => {
    userSearch.handleSearchInput(value);
  };

  // Error message helpers
  const searchErrorMessage = () => userSearch.errorMessage();
  const friendRequestsErrorMessage = () => friendRequestsQuery.error?.message || 'Failed to load friend requests';
  const sentFriendRequestsErrorMessage = () => sentFriendRequestsQuery.error?.message || 'Failed to load sent friend requests';
  const friendsErrorMessage = () => friendsListQuery.error?.message || 'Failed to load friends';

  // Mutation error message helpers
  const sendFriendRequestErrorMessage = () => sendFriendRequestMutation.error?.message || 'Failed to send friend request';
  const acceptFriendRequestErrorMessage = () => acceptFriendRequestMutation.error?.message || 'Failed to accept friend request';
  const declineFriendRequestErrorMessage = () => declineFriendRequestMutation.error?.message || 'Failed to decline friend request';
  const cancelFriendRequestErrorMessage = () => cancelFriendRequestMutation.error?.message || 'Failed to cancel friend request';
  const removeFriendErrorMessage = () => removeFriendMutation.error?.message || 'Failed to remove friend';

  return {
    // State
    searchInput,
    debouncedInput,

    // Computed data
    searchResults,
    friendRequests,
    sentFriendRequests,
    friendsList,

    // Loading states
    isLoadingSearch,
    isLoadingFriendRequests,
    isLoadingSentFriendRequests,
    isLoadingFriends,

    // Mutation loading states
    isSendingFriendRequest,
    isAcceptingFriendRequest,
    isDecliningFriendRequest,
    isCancellingFriendRequest,
    isRemovingFriend,

    // Error states
    hasSearchError,
    hasFriendRequestsError,
    hasSentFriendRequestsError,
    hasFriendsError,
    hasSendFriendRequestError,
    hasAcceptFriendRequestError,
    hasDeclineFriendRequestError,
    hasCancelFriendRequestError,
    hasRemoveFriendError,

    // Error messages
    searchErrorMessage,
    friendRequestsErrorMessage,
    sentFriendRequestsErrorMessage,
    friendsErrorMessage,
    sendFriendRequestErrorMessage,
    acceptFriendRequestErrorMessage,
    declineFriendRequestErrorMessage,
    cancelFriendRequestErrorMessage,
    removeFriendErrorMessage,

    // Event handlers
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleCancelFriendRequest,
    handleRemoveFriend,
    handleSearchInput,
  };
}

interface UserFriendsProps {
}

const UserFriendsContext = createContext<ReturnType<typeof useUserFriendsHook>>();

export const UserFriendsProvider: ParentComponent<UserFriendsProps> = (props) => {
  const hook = useUserFriendsHook()
  return (
    <UserFriendsContext.Provider value={hook}>
      {props.children}
    </UserFriendsContext.Provider>
  );
}
export const useFriends = () => useContext(UserFriendsContext)!
