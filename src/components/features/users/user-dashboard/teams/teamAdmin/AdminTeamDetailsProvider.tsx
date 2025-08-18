import {createContext, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpc} from "../../../../../../lib/orpc/client.ts";

const useAdminTeamDetailsHook = (teamId: number) => {
  const queryClient = useQueryClient();
  const teams = orpc.private.teams;
  const teamsSSE = orpc.private.teamsSSE;

  // Team data queries
  const teamQuery = useQuery(() =>
    teams.getTeamById.queryOptions({
      input: {teamId},
      staleTime: 30 * 1000, // 30 seconds
    }),
  );

  const membersQuery = useQuery(() =>
    teamsSSE.getTeamMembersSSE.experimental_liveOptions({
      input: {teamId},
      staleTime: 30 * 1000,
    })
  );

  const inviteQuery = useQuery(() => teamsSSE.getTeamInvitesSSE.experimental_liveOptions({
    input: {teamId},
    staleTime: 30 * 1000,
  }))

  // Team management mutations
  const inviteUserMutation = useMutation(() =>
    teams.createInvite.mutationOptions({
      onSuccess: async () => {
        // Invalidate related queries
        await queryClient.invalidateQueries({queryKey: teams.getTeamMembers.queryKey({input: {teamId}})});
        await queryClient.invalidateQueries({queryKey: teams.getTeamMemberCount.queryKey({input: {teamId}})});
      },
    })
  );

  const removeUserMutation = useMutation(() =>
    teams.removeMember.mutationOptions({
      onSuccess: async () => {
        // await queryClient.invalidateQueries({queryKey: teams.getTeamMembers.queryKey({input: {teamId}})});
      },
    })
  );

  const cancelInviteMutation = useMutation(() =>
    teams.deleteInvite.mutationOptions({
      onSuccess: async () => {
      },
    })
  );

  const deleteTeamMutation = useMutation(() =>
    teams.delete.mutationOptions()
  );

  const updateTeamMutation = useMutation(() =>
    teams.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({queryKey: teams.getTeamById.queryKey({input: {teamId}})});
      },
    })
  );

  // Action handlers with error handling
  const inviteUser = async (invitedUserId: number) => {
    try {
      await inviteUserMutation.mutateAsync({
        invitedUserId,
        teamId,
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to invite user to team');
    }
  };

  const removeUser = async (userId: number) => {
    try {
      await removeUserMutation.mutateAsync({
        userId,
        teamId,
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to remove user from team');
    }
  };

  const cancelInvite = async (invitedUserId: number) => {
    try {
      await cancelInviteMutation.mutateAsync({
        invitedUserId,
        teamId,
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to cancel invite');
    }
  };

  const deleteTeam = async () => {
    try {
      await deleteTeamMutation.mutateAsync({teamId});
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to delete team');
    }
  };

  const updateTeam = async (name: string, slug: string, visible?: boolean) => {
    try {
      await updateTeamMutation.mutateAsync({
        teamId,
        name,
        slug,
        visible: visible !== undefined ? visible : teamQuery.data?.visible || false,
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update team');
    }
  };

  return {
    teamId,
    // Team management functions
    inviteUser,
    inviteUserMutation,
    removeUser,
    removeUserMutation,
    cancelInvite,
    cancelInviteMutation,
    deleteTeam,
    deleteTeamMutation,
    updateTeam,
    updateTeamMutation,
    // Team Queries,
    team: teamQuery,
    members: membersQuery,
    invites: inviteQuery,
  };
}

interface AdminTeamDetailsProps {
  teamId: number;
}

const AdminTeamDetailsContext = createContext<ReturnType<typeof useAdminTeamDetailsHook>>();

export const AdminTeamDetailsProvider: ParentComponent<AdminTeamDetailsProps> = (props) => {
  const hook = useAdminTeamDetailsHook(props.teamId);
  return (
    <AdminTeamDetailsContext.Provider value={hook}>
      {props.children}
    </AdminTeamDetailsContext.Provider>
  );
}
export const useAdminTeamDetail = () => useContext(AdminTeamDetailsContext)!
