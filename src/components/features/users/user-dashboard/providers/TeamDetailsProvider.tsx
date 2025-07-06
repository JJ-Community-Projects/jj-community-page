import {createStore} from "solid-js/store";
import {createContext, onMount, type ParentComponent, useContext} from "solid-js";
import {actions} from "astro:actions";
import {useTinystore} from "../../../../../lib/useTinystore.ts";
import type {User} from "../../../../../lib/auth/User.ts";

type HookActions = {
  inviteUser: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeUser: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  cancelInvite: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateTeam: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

const initHookState: HookActions = {
  inviteUser: {
    actionInProgress: false,
  },
  removeUser: {
    actionInProgress: false,
  },
  cancelInvite: {
    actionInProgress: false,
  },
  deleteTeam: {
    actionInProgress: false,
  },
  updateTeam: {
    actionInProgress: false,
  },
}

const useTeamHook = (teamId: number, user: User) => {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol
  const ws = (protocol === "http:" || protocol === "http") ? "ws" : "wss";
  const isProd = ws === 'wss';
  const url = isProd ? `wss://${hostname}/api/ws/teams/${teamId}`:
    `ws://${hostname}:${port}/api/ws/teams/${teamId}`
  console.log('useTeamHook', url)
  const {clientStore: store, addListener} = useTinystore(url)

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
    id: number
    name: string
    ownerId: number
    description: string | null
    slug: string
    visible: boolean
    invites: {
      username: string
      invitedUserId: number;
      teamId: number;
    }[],
    members: {
      userId: number;
      teamId: number;
      username: string
    }[],
  }>({
    id: -1,
    name: '',
    ownerId: -1,
    description: '',
    slug: '',
    visible: false,
    invites: [],
    members: [],
  });

  onMount(() => {
    //----------------------------------------------
    // Listeners for real-time updates
    //----------------------------------------------

    // Listen for changes to team invites
    addListener(store.addHasRowListener(
      'invites', null,
      (s, __, rowId, added) => {
        const userId = parseInt(rowId);
        if (added) {
          const value = s.getRow('invites', rowId);
          const invite = {
            invitedUserId: value.invitedUserId as number,
            teamId: value.teamId as number,
            username: value.username as string,
          }
          setLocal('invites', (invites) =>
            invites.concat(invite));
        } else {
          setLocal('invites', (invites) => {
            return invites.filter((i) => i.invitedUserId !== userId);
          });
        }
      }
    ));

    // Listen for changes to team members
    addListener(store.addHasRowListener(
      'members', null,
      (s, __, rowId, added) => {
        const userId = parseInt(rowId);
        if (added) {
          const value = s.getRow('members', rowId);
          const member = {
            userId: value.userId as number,
            teamId: value.teamId as number,
            username: value.username as string,
          }
          setLocal('members', (members) =>
            members.concat(member));
        } else {
          setLocal('members', (members) => {
            return members.filter((m) => m.userId !== userId);
          });
        }
      }
    ));

    addListener(store.addValueListener('name', (s, id, value) => {
      setLocal('name', value as string);
    }))

    addListener(store.addValueListener('teamId', (s, id, value) => {
      setLocal('id', value as number);
    }))

    addListener(store.addValueListener('ownerId', (s, id, value) => {
      setLocal('ownerId', value as number);
    }))

    addListener(store.addValueListener('description', (s, id, value) => {
      setLocal('description', value as string);
    }))

    addListener(store.addValueListener('slug', (s, id, value) => {
      setLocal('slug', value as string);
    }))

    addListener(store.addValueListener('visible', (s, id, value) => {
      setLocal('visible', value as boolean);
    }))
  })


  //----------------------------------------------
  // Team Management Functions
  //----------------------------------------------

  // Invite a user to the team
  const inviteUser = async (invitedUserId: number) => {
    startAction('inviteUser')
    const result = await actions.teamInvites.invite({invitedUserId, teamId});
    stopAction('inviteUser')
    if (result.error) {
      setLastError('inviteUser', result.error.message);
      throw new Error(result.error.message || 'Failed to invite user to team');
    }
    return result;
  };

  // Remove a user from the team (team owner only)
  const removeUser = async (userId: number) => {
    startAction('removeUser')
    const result = await actions.teams.removeUser({userId, teamId});
    stopAction('removeUser')
    if (result.error) {
      setLastError('removeUser', result.error.message || 'Failed to remove user from team');
      throw new Error(result.error.message || 'Failed to remove user from team');
    }
    return result;
  };

  // Cancel an invite to the team (team owner only)
  const cancelInvite = async (invitedUserId: number) => {
    startAction('cancelInvite')
    const result = await actions.teamInvites.removeInvite({invitedUserId, teamId});
    stopAction('cancelInvite')
    if (result.error) {
      setLastError('cancelInvite', result.error.message || 'Failed to cancel invite');
      throw new Error(result.error.message || 'Failed to cancel invite');
    }
    return result;
  };

  // Delete the team (team owner only)
  const deleteTeam = async () => {
    startAction('deleteTeam')
    const result = await actions.teams.deleteTeam(teamId);
    stopAction('deleteTeam')
    if (result.error) {
      setLastError('deleteTeam', result.error.message || 'Failed to delete team');
      throw new Error(result.error.message || 'Failed to delete team');
    }
    return result;
  };

  // Update team details (team owner only)
  const updateTeam = async (name: string, slug: string, visible?: boolean) => {
    startAction('updateTeam')
    const result = await actions.teams.update({
      id: teamId,
      name: name,
      slug: slug,
      visible: visible !== undefined ? visible : local.visible
    });
    stopAction('updateTeam')
    if (result.error) {
      setLastError('updateTeam', result.error.message || 'Failed to update team');
      throw new Error(result.error.message || 'Failed to update team');
    }
    return result;
  };

  return {
    local,
    setLocal,
    teamId,
    user,
    // Team management
    inviteUser,
    removeUser,
    cancelInvite,
    deleteTeam,
    updateTeam,
    // Action state
    action: action
  };
};

interface TeamProviderProps {
  teamId: number;
  user: User;
}

const TeamContext = createContext<ReturnType<typeof useTeamHook>>();

export const TeamDetailsProvider: ParentComponent<TeamProviderProps> = (props) => {
  const hook = useTeamHook(props.teamId, props.user);
  return (
    <TeamContext.Provider value={hook}>{props.children}</TeamContext.Provider>
  );
};

export const useTeamDetail = () => useContext(TeamContext)!;
