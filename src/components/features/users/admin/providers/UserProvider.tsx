import {createStore} from "solid-js/store";
import {createContext, onMount, type ParentComponent, useContext} from "solid-js";
import {actions} from "astro:actions";
import {useTinystore} from "../../../../../lib/useTinystore.ts";
import type {User} from "../../../../../lib/auth/User.ts";

type HookActions = {
  createSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  createTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  isTeamSlugUnique: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  inviteUserToTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  acceptTeamInvite: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  rejectTeamInvite: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  leaveTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeUserFromTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  getPopularTags: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  getSuggestedTagsForUser: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  getSuggestedTagsForUserBySearchTerm: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addSocial: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeSocial: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  fetchSocialsFromTiltify: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateUserStyle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  setPrimaryLiveStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

const initHookState: HookActions = {
  createSchedule: {
    actionInProgress: false,
  },
  deleteSchedule: {
    actionInProgress: false,
  },
  createTeam: {
    actionInProgress: false,
  },
  isTeamSlugUnique: {
    actionInProgress: false,
  },
  inviteUserToTeam: {
    actionInProgress: false,
  },
  acceptTeamInvite: {
    actionInProgress: false,
  },
  rejectTeamInvite: {
    actionInProgress: false,
  },
  leaveTeam: {
    actionInProgress: false,
  },
  removeUserFromTeam: {
    actionInProgress: false,
  },
  deleteTeam: {
    actionInProgress: false,
  },
  addTag: {
    actionInProgress: false,
  },
  removeTag: {
    actionInProgress: false,
  },
  getPopularTags: {
    actionInProgress: false,
  },
  getSuggestedTagsForUser: {
    actionInProgress: false,
  },
  getSuggestedTagsForUserBySearchTerm: {
    actionInProgress: false,
  },
  addSocial: {
    actionInProgress: false,
  },
  removeSocial: {
    actionInProgress: false,
  },
  fetchSocialsFromTiltify: {
    actionInProgress: false,
  },
  updateUserStyle: {
    actionInProgress: false,
  },
  setPrimaryLiveStream: {
    actionInProgress: false,
  },
}

const useUserHook = (user: User) => {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol
  const ws = (protocol === "http:" || protocol === "http") ? "wss" : "ws";

  const {clientStore: store, addListener} = useTinystore(`${ws}://${hostname}:${port}/api/ws/users/${user.id}`)

  const [action, setAction] = createStore<HookActions>(initHookState)

  const startAction = (key: (keyof HookActions)) => {
    setAction(key, {
      actionInProgress: true,
      lastErrorMessage: undefined,
    })
  }

  const stopAction = (key: (keyof HookActions)) => {
    setAction(key, 'actionInProgress', false)
  }

  const setLastError = (key: (keyof HookActions), error: string) => {
    setAction(key, 'lastErrorMessage', error)
  }

  const [local, setLocal] = createStore<{
    schedules: {
      id: number;
      title: string;
      year: number;
      visible: boolean;
    }[],
    invites: {
      invitedUserId: number;
      teamId: number;
      name: string;
    }[],
    teamMembers: {
      id: number;
      ownerId: number;
      name: string;
      slug: string;
    }[],
    userTags: {
      tag: string;
      label: string;
      addedAt: string;
    }[],
    userSocials: {
      provider: string;
      url: string;
    }[],
    userStyle: {
      primaryColor: string;
      accentColor: string;
    } | null,
    primaryLiveStream: string,
  }>({
    schedules: [],
    invites: [],
    teamMembers: [],
    userTags: [],
    userSocials: [],
    userStyle: null,
    primaryLiveStream: 'twitch', // Default value
  });

  onMount(() => {
    //----------------------------------------------
    // Listeners for real-time updates
    //----------------------------------------------

    // Listen for changes to schedules
    addListener(store.addHasRowListener(
      'schedules', null,
      (s, __, rowId, added) => {
        const scheduleId = parseInt(rowId);
        console.log('schedules', 'rowListener')
        if (added) {
          const value = s.getRow('schedules', rowId);
          const schedule = {
            id: value.id as number,
            title: value.title as string,
            year: value.year as number,
            visible: value.visible as boolean,
          }
          setLocal('schedules', (schedules) =>
            schedules.concat(schedule).sort((a, b) => b.year - a.year)); // Sort by year descending
        } else {
          setLocal('schedules', (schedules) => {
            return schedules.filter((s) => s.id !== scheduleId);
          });
        }
      }
    ));

    // Listen for changes to team invites
    addListener(store.addHasRowListener(
      'invites', null,
      (s, __, rowId, added) => {
        const teamId = parseInt(rowId);
        console.log('invites', 'rowListener')
        if (added) {
          const value = s.getRow('invites', rowId);
          const invite = {
            invitedUserId: value.invitedUserId as number,
            teamId: value.teamId as number,
            name: value.name as string,
          }
          setLocal('invites', (invites) =>
            invites.concat(invite));
        } else {
          setLocal('invites', (invites) => {
            return invites.filter((i) => i.teamId !== teamId);
          });
        }
      }
    ));

    // Listen for changes to team memberships
    addListener(store.addHasRowListener(
      'teamMembers', null,
      (s, __, rowId, added) => {
        const teamId = parseInt(rowId);
        console.log('teamMembers', 'rowListener')
        if (added) {
          const value = s.getRow('teamMembers', rowId);
          const teamMember = {
            id: value.teamId as number,
            name: value.name as string,
            slug: value.slug as string,
            ownerId: value.ownerId as number,
          }
          setLocal('teamMembers', (teamMembers) =>
            teamMembers.concat(teamMember));
        } else {
          setLocal('teamMembers', (teamMembers) => {
            return teamMembers.filter((tm) => tm.id !== teamId);
          });
        }
      }
    ));

    // Listen for changes to user tags
    addListener(store.addHasRowListener(
      'userTags', null,
      (s, __, rowId, added) => {
        console.log('userTags', 'rowListener')
        if (added) {
          const value = s.getRow('userTags', rowId);
          const tag = {
            tag: value.tag as string,
            label: value.label as string,
            addedAt: value.addedAt as string,
          }
          setLocal('userTags', (userTags) =>
            userTags.concat(tag));
        } else {
          setLocal('userTags', (userTags) => {
            return userTags.filter((t) => t.tag !== rowId);
          });
        }
      }
    ));

    // Listen for changes to user socials
    addListener(store.addHasRowListener(
      'userSocials', null,
      (s, __, rowId, added) => {
        console.log('userSocials', 'rowListener')
        if (added) {
          const value = s.getRow('userSocials', rowId);
          const social = {
            provider: value.provider as string,
            url: value.url as string,
          }
          setLocal('userSocials', (userSocials) =>
            userSocials.concat(social));
        } else {
          setLocal('userSocials', (userSocials) => {
            return userSocials.filter((s) => s.provider !== rowId);
          });
        }
      }
    ));

    // Listen for changes to user style
    addListener(store.addHasRowListener(
      'userStyle', null,
      (s, __, rowId, added) => {
        console.log('userStyle', 'rowListener')
        if (added) {
          const value = s.getRow('userStyle', rowId);
          const style = {
            primaryColor: value.primaryColor as string,
            accentColor: value.accentColor as string,
          }
          setLocal('userStyle', style);
        } else {
          setLocal('userStyle', null);
        }
      }
    ));

    // Listen for changes to user settings (primaryLiveStream)
    addListener(store.addHasRowListener(
      'userSettings', null,
      (s, __, rowId, added) => {
        console.log('userSettings', 'rowListener', rowId)
        if (added && rowId === 'primaryLiveStream') {
          const value = s.getRow('userSettings', rowId);
          setLocal('primaryLiveStream', value.platform as string);
        }
      }
    ));

  })


  //----------------------------------------------
  // Schedule Management Functions
  //----------------------------------------------

  // Create a new schedule - this will call the API endpoint, not directly modify the UserDO
  const createSchedule = async () => {
    startAction('createSchedule');
    try {
      const schedule = await actions.schedules.create();
      stopAction('createSchedule');
      if (schedule.error) {
        const errorMsg = schedule.error.message || 'Failed to create schedule';
        setLastError('createSchedule', errorMsg);
        throw new Error(errorMsg);
      } else {
        return schedule;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('createSchedule', errorMsg);
      stopAction('createSchedule');
      throw error;
    }
  };

  // Delete a schedule
  const deleteSchedule = async (scheduleId: number) => {
    startAction('deleteSchedule');
    try {
      const result = await actions.schedules.delete(scheduleId);
      stopAction('deleteSchedule');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to delete schedule';
        setLastError('deleteSchedule', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('deleteSchedule', errorMsg);
      stopAction('deleteSchedule');
      throw error;
    }
  };

  //----------------------------------------------
  // Team Management Functions
  //----------------------------------------------

  // Create a new team
  const createTeam = async (name: string, slug: string) => {
    startAction('createTeam');
    try {
      const result = await actions.teams.create({name, slug});
      stopAction('createTeam');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to create team';
        setLastError('createTeam', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('createTeam', errorMsg);
      stopAction('createTeam');
      throw error;
    }
  };

  // Check if a team slug is valid and get suggestions if not
  const isTeamSlugUnique = async (slug: string, tiltifyName?: string) => {
    startAction('isTeamSlugUnique');
    try {
      const result = await actions.teams.isSlugValid({slug, tiltifyName});
      stopAction('isTeamSlugUnique');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to validate slug';
        setLastError('isTeamSlugUnique', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('isTeamSlugUnique', errorMsg);
      stopAction('isTeamSlugUnique');
      throw error;
    }
  };

  // Invite a user to a team
  const inviteUserToTeam = async (invitedUserId: number, teamId: number) => {
    startAction('inviteUserToTeam');
    try {
      const result = await actions.teamInvites.invite({invitedUserId, teamId});
      stopAction('inviteUserToTeam');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to invite user to team';
        setLastError('inviteUserToTeam', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('inviteUserToTeam', errorMsg);
      stopAction('inviteUserToTeam');
      throw error;
    }
  };

  // Note: Additional team management functions like deleteInvite and removeUserFromTeam
  // would require implementing corresponding actions in teams.ts

  //----------------------------------------------
  // Team Membership Functions
  //----------------------------------------------

  // Accept a team invite
  const acceptTeamInvite = async (teamId: number) => {
    startAction('acceptTeamInvite');
    try {
      const result = await actions.teamInvites.acceptInvite(teamId);
      stopAction('acceptTeamInvite');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to accept team invite';
        setLastError('acceptTeamInvite', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('acceptTeamInvite', errorMsg);
      stopAction('acceptTeamInvite');
      throw error;
    }
  };

  // Reject a team invite
  const rejectTeamInvite = async (teamId: number) => {
    startAction('rejectTeamInvite');
    try {
      const result = await actions.teamInvites.rejectInvite(teamId);
      stopAction('rejectTeamInvite');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to reject team invite';
        setLastError('rejectTeamInvite', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('rejectTeamInvite', errorMsg);
      stopAction('rejectTeamInvite');
      throw error;
    }
  };

  // Leave a team
  const leaveTeam = async (teamId: number) => {
    startAction('leaveTeam');
    try {
      const result = await actions.teams.leaveTeam(teamId);
      stopAction('leaveTeam');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to leave team';
        setLastError('leaveTeam', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('leaveTeam', errorMsg);
      stopAction('leaveTeam');
      throw error;
    }
  };

  // Remove a user from a team (team owner only)
  const removeUserFromTeam = async (userId: number, teamId: number) => {
    startAction('removeUserFromTeam');
    try {
      const result = await actions.teams.removeUser({userId, teamId});
      stopAction('removeUserFromTeam');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to remove user from team';
        setLastError('removeUserFromTeam', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('removeUserFromTeam', errorMsg);
      stopAction('removeUserFromTeam');
      throw error;
    }
  };

  // Delete a team (team owner only)
  const deleteTeam = async (teamId: number) => {
    startAction('deleteTeam');
    try {
      const result = await actions.teams.deleteTeam(teamId);
      stopAction('deleteTeam');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to delete team';
        setLastError('deleteTeam', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('deleteTeam', errorMsg);
      stopAction('deleteTeam');
      throw error;
    }
  };

  //----------------------------------------------
  // Tag Management Functions
  //----------------------------------------------

  // Add a tag to the user
  const addTag = async (tag: string, label?: string) => {
    startAction('addTag');
    try {
      const result = await actions.users.addTag({tag, label});
      stopAction('addTag');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to add tag';
        setLastError('addTag', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('addTag', errorMsg);
      stopAction('addTag');
      throw error;
    }
  };

  //----------------------------------------------
  // Social Media Management Functions
  //----------------------------------------------

  // Add a social media link to the user
  const addSocial = async (provider: string, url: string) => {
    startAction('addSocial');
    try {
      const result = await actions.users.addSocial({provider, url});
      stopAction('addSocial');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to add social media link';
        setLastError('addSocial', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('addSocial', errorMsg);
      stopAction('addSocial');
      throw error;
    }
  };

  // Remove a social media link from the user
  const removeSocial = async (provider: string) => {
    startAction('removeSocial');
    try {
      const result = await actions.users.removeSocial({provider});
      stopAction('removeSocial');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to remove social media link';
        setLastError('removeSocial', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('removeSocial', errorMsg);
      stopAction('removeSocial');
      throw error;
    }
  };

  // Fetch socials from Tiltify and add them to the user
  const fetchSocialsFromTiltify = async () => {
    startAction('fetchSocialsFromTiltify');
    try {
      const result = await actions.users.fetchSocialsFromTiltify();
      stopAction('fetchSocialsFromTiltify');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to fetch socials from Tiltify';
        setLastError('fetchSocialsFromTiltify', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('fetchSocialsFromTiltify', errorMsg);
      stopAction('fetchSocialsFromTiltify');
      throw error;
    }
  };

  // Remove a tag from the user
  const removeTag = async (tag: string) => {
    startAction('removeTag');
    try {
      const result = await actions.users.removeTag({tag});
      stopAction('removeTag');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to remove tag';
        setLastError('removeTag', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('removeTag', errorMsg);
      stopAction('removeTag');
      throw error;
    }
  };

  // Get popular tags
  const getPopularTags = async (limit: number = 5) => {
    startAction('getPopularTags');
    try {
      const result = await actions.users.getPopularTags(limit);
      stopAction('getPopularTags');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to get popular tags';
        setLastError('getPopularTags', errorMsg);
        return {
          tags: [],
          defaultTags: [],
          charityTags: [],
        }
      }
      return result.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('getPopularTags', errorMsg);
      stopAction('getPopularTags');
      return {
        tags: [],
        defaultTags: [],
        charityTags: [],
      }
    }
  };

  // Get suggested tags for user
  const getSuggestedTagsForUser = async (userId: number, limit: number = 5) => {
    startAction('getSuggestedTagsForUser');
    try {
      const result = await actions.users.getSuggestedTagsForUser({userId, limit});
      stopAction('getSuggestedTagsForUser');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to get suggested tags for user';
        setLastError('getSuggestedTagsForUser', errorMsg);
        return {
          tags: [],
          defaultTags: [],
          charityTags: [],
        }
      }
      return result.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('getSuggestedTagsForUser', errorMsg);
      stopAction('getSuggestedTagsForUser');
      return {
        tags: [],
        defaultTags: [],
        charityTags: [],
      }
    }
  };

  // Get suggested tags for user by search term
  const getSuggestedTagsForUserBySearchTerm =
    async (userId: number, term: string, limit: number = 5) => {
      startAction('getSuggestedTagsForUserBySearchTerm');
      try {
        const result = await actions.users.getSuggestedTagsForUserBySearchTerm({userId, term, limit});
        stopAction('getSuggestedTagsForUserBySearchTerm');
        if (result.error) {
          const errorMsg = result.error.message || 'Failed to get suggested tags for user by search term';
          setLastError('getSuggestedTagsForUserBySearchTerm', errorMsg);
          return {
            tags: [],
            defaultTags: [],
            charityTags: [],
          }
        }
        return result.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
        setLastError('getSuggestedTagsForUserBySearchTerm', errorMsg);
        stopAction('getSuggestedTagsForUserBySearchTerm');
        return {
          tags: [],
          defaultTags: [],
          charityTags: [],
        }
      }
    };

  //----------------------------------------------
  // User Style Management Functions
  //----------------------------------------------

  // Update user style
  const updateUserStyle = async (primaryColor: string, accentColor: string) => {
    startAction('updateUserStyle');
    try {
      const result = await actions.users.updateUserStyle({primaryColor, accentColor});
      stopAction('updateUserStyle');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to update user style';
        setLastError('updateUserStyle', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateUserStyle', errorMsg);
      stopAction('updateUserStyle');
      throw error;
    }
  };

  //----------------------------------------------
  // Primary Live Stream Management Functions
  //----------------------------------------------

  // Set primary live stream platform
  const setPrimaryLiveStream = async (platform: string) => {
    startAction('setPrimaryLiveStream');
    try {
      const result = await actions.users.setPrimaryLiveStream({platform});
      stopAction('setPrimaryLiveStream');
      if (result.error) {
        const errorMsg = result.error.message || 'Failed to set primary live stream platform';
        setLastError('setPrimaryLiveStream', errorMsg);
        throw new Error(errorMsg);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('setPrimaryLiveStream', errorMsg);
      stopAction('setPrimaryLiveStream');
      throw error;
    }
  };

  return {
    local,
    user,
    // Schedule management
    createSchedule,
    deleteSchedule,
    // Team management
    createTeam,
    isTeamSlugUnique,
    inviteUserToTeam,
    deleteTeam,
    // Team membership
    acceptTeamInvite,
    rejectTeamInvite,
    leaveTeam,
    removeUserFromTeam,
    // Tag management
    addTag,
    removeTag,
    getPopularTags,
    getSuggestedTagsForUser,
    getSuggestedTagsForUserBySearchTerm,
    // Social media management
    addSocial,
    removeSocial,
    fetchSocialsFromTiltify,
    // User style management
    updateUserStyle,
    // Primary live stream management
    setPrimaryLiveStream,
    // Action state
    action: action
  };
};

interface UserProviderProps {
  user: User
}

const UserContext = createContext<ReturnType<typeof useUserHook>>();

export const UserProvider: ParentComponent<UserProviderProps> = (props) => {
  const hook = useUserHook(props.user);
  return (
    <UserContext.Provider value={hook}>{props.children}</UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext)!;
