import {createContext, type ParentComponent, useContext} from "solid-js";
import {useMutation, useQuery, useQueryClient} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {feedRenewal} from "../../../../../lib/orpc/tokenRenewal.ts";

const useTeamDetailsHook = (teamId: number) => {
  const queryClient = useQueryClient();
  const teams = orpcPrivate.teams;
  const teamsWS = orpcPrivate.teamsWS;

  // Team-specific data queries
  const teamQuery = useQuery(() =>
    teams.getTeamById.queryOptions({
      input: {teamId},
      staleTime: 30 * 1000, // 30 seconds
    })
  );

  // A member who leaves or is removed loses the feed at the next token renewal.
  const teamMembersQuery = useQuery(() =>
    teamsWS.getTeamAdminMembersWS.experimental_liveOptions({
      input: {teamId},
      context: feedRenewal(queryClient, teamsWS.getTeamAdminMembersWS, {teamId}),
      staleTime: 30 * 1000,
    })
  );


  // Team management mutations
  const createTeamMutation = useMutation(() =>
    teams.create.mutationOptions({
      onSuccess: async () => {
        // Invalidate user teams query to refresh the list
        await queryClient.invalidateQueries({queryKey: teams.getUserTeams.queryKey()});
      },
    })
  );

  const deleteTeamMutation = useMutation(() =>
    teams.delete.mutationOptions({
      onSuccess: async () => {
        // Invalidate user teams query to refresh the list
        await queryClient.invalidateQueries({queryKey: teams.getUserTeams.queryKey()});
        // Invalidate team-specific queries
        await queryClient.invalidateQueries({queryKey: teams.getTeamById.queryKey({input: {teamId}})});
      },
    })
  );

  const leaveTeamMutation = useMutation(() =>
    teams.leaveTeam.mutationOptions({
      onSuccess: async () => {
        // Invalidate user teams query to refresh the list
        await queryClient.invalidateQueries({queryKey: teams.getUserTeams.queryKey()});
        // Invalidate team-specific queries since user is no longer a member
        await queryClient.invalidateQueries({queryKey: teams.getTeamById.queryKey({input: {teamId}})});
      },
    })
  );

  // Action handlers with error handling
  const createTeam = async (name: string, slug: string) => {
    try {
      await createTeamMutation.mutateAsync({
        name,
        slug,
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create team');
    }
  };

  const deleteTeam = async (teamId: number) => {
    try {
      await deleteTeamMutation.mutateAsync({teamId});
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to delete team');
    }
  };

  const leaveTeam = async (teamId: number) => {
    try {
      await leaveTeamMutation.mutateAsync({teamId});
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to leave team');
    }
  };

  return {
    teamId,
    // Team management functions
    createTeam,
    createTeamMutation,
    deleteTeam,
    deleteTeamMutation,
    leaveTeam,
    leaveTeamMutation,
    // Team-specific data queries
    team: teamQuery,
    members: teamMembersQuery,
  };
};

interface TeamDetailsProviderProps {
  teamId: number;
}

const TeamDetailsContext = createContext<ReturnType<typeof useTeamDetailsHook>>();

export const TeamDetailsProvider: ParentComponent<TeamDetailsProviderProps> = (props) => {
  const hook = useTeamDetailsHook(props.teamId);
  return (
    <TeamDetailsContext.Provider value={hook}>
      {props.children}
    </TeamDetailsContext.Provider>
  );
};

export const useTeamDetails = () => useContext(TeamDetailsContext)!;
