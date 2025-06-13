import {type Component, createSignal, For, Show} from "solid-js";
import {UserProvider, useUser} from "../providers/UserProvider.tsx";
import {actions} from "astro:actions";
import type {User} from "../../../lib/auth/User.ts";
import {TextField} from "@kobalte/core/text-field";
import {Dialog} from "@kobalte/core/dialog";
import {createStore} from "solid-js/store";
import {debounce} from "@solid-primitives/scheduled";
import {UserDODebug} from "../../../pages/[username]/admin/UserDODebug.tsx";
import {ConfirmationDialog} from "../../common/ConfirmationDialog";
import {createModalSignal} from "../../../lib/createModalSignal";

interface TeamsListProps {
  user: User
}

export const TeamsList: Component<TeamsListProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <TeamsListContent />
    </UserProvider>
  );
};

const TeamsListContent: Component = () => {
  const {local} = useUser()
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <TeamsHeader />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OwnedTeamsList />
        <MemberTeamsList />
        <InvitesList />
      </div>
    </div>
  );
};

const TeamsHeader: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);

  const {user} = useUser()
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/${user.tiltifyName}/admin`} class="text-primary hover:underline">
            &larr; Back to Admin
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Your Teams</h2>
          <button
            class="bg-accent hover:bg-accent-400 text-white px-4 py-2 rounded-lg transition-all"
            onClick={() => setIsOpen(true)}
          >
            Create Team
          </button>
        </div>
      </div>

      <CreateTeamDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
};

const CreateTeamDialog: Component<{isOpen: () => boolean, setIsOpen: (open: boolean) => void}> = (props) => {
  const {createTeam, isTeamSlugUnique, action} = useUser();
  const [formState, setFormState] = createStore({
    name: "",
    slug: "",
    isSlugValid: true,
    suggestions: [] as string[]
  });

  // Create debounced function for slug validation
  const checkSlugUnique = debounce(async (slug: string) => {
    if (!slug) {
      setFormState("isSlugValid", false);
      setFormState("suggestions", []);
      return;
    }

    try {
      const {data, error} = await isTeamSlugUnique(slug, formState.name);
      if (error) {
        console.error("Error checking slug:", error);
        setFormState("isSlugValid", false);
        setFormState("suggestions", []);
        return;
      }

      setFormState("isSlugValid", data.isValid);
      setFormState("suggestions", data.suggestions || []);
    } catch (error) {
      console.error("Error checking slug:", error);
      setFormState("isSlugValid", false);
      setFormState("suggestions", []);
    }
  }, 500);

  const handleNameChange = (value: string) => {
    setFormState("name", value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    if (!formState.slug) {
      const generatedSlug = value.toLowerCase().replace(/[^a-z0-9]/g, "-");
      setFormState("slug", generatedSlug);
      checkSlugUnique(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setFormState("slug", sanitizedSlug);
    checkSlugUnique(sanitizedSlug);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formState.name || !formState.slug || !formState.isSlugValid) {
      return;
    }

    try {
      await createTeam(formState.name, formState.slug);
      props.setIsOpen(false);
      setFormState({
        name: "",
        slug: "",
        isSlugValid: true,
        suggestions: []
      });
    } catch (error) {
      console.error("Failed to create team:", error);
      // Error is already handled by the action state
    }
  };

  return (
    <Dialog open={props.isOpen()} onOpenChange={props.setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40" />
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <Dialog.Title class="text-xl font-bold mb-4">Create New Team</Dialog.Title>
            <Dialog.Description class="text-gray-600 mb-4">
              Create a new team to collaborate with others on JingleJam schedules.
            </Dialog.Description>

            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              <TextField value={formState.name} onChange={handleNameChange}>
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </TextField.Label>
                <TextField.Input
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="My Awesome Team"
                />
              </TextField>

              <TextField
                value={formState.slug}
                onChange={handleSlugChange}
                validationState={formState.isSlugValid ? "valid" : "invalid"}
              >
                <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">
                  Team Slug
                </TextField.Label>
                <div class="relative">
                  <TextField.Input
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="my-awesome-team"
                  />
                  <Show when={action.isTeamSlugUnique.actionInProgress}>
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                    </div>
                  </Show>
                </div>
                <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
                  {!formState.isSlugValid ? "This slug is not available. Try one of these suggestions:" : action.isTeamSlugUnique.lastErrorMessage}
                </TextField.ErrorMessage>

                <Show when={formState.suggestions.length > 0}>
                  <div class="mt-2">
                    <ul class="flex flex-wrap gap-2">
                      <For each={formState.suggestions}>
                        {(suggestion) => (
                          <li>
                            <button
                              type="button"
                              class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                              onClick={() => {
                                setFormState("slug", suggestion);
                                checkSlugUnique(suggestion);
                              }}
                            >
                              {suggestion}
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>

                <p class="text-xs text-gray-500 mt-1">
                  This will be used in URLs: jj.ostof.dev/teams/{formState.slug || "your-team-slug"}
                </p>
              </TextField>

              <Show when={action.createTeam.lastErrorMessage}>
                <div class="text-red-500 text-sm mt-2">
                  {action.createTeam.lastErrorMessage}
                </div>
              </Show>

              <div class="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => props.setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formState.name || !formState.slug || !formState.isSlugValid || action.createTeam.actionInProgress}
                >
                  {action.createTeam.actionInProgress ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
};

const OwnedTeamsList: Component = () => {
  const {local, user} = useUser();

  const ownedTeams = () => {
    return local.teamMembers.filter((m) => m.ownerId === user.id);
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You Own</h3>

      <Show when={ownedTeams().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You don't own any teams yet.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={ownedTeams()}>
            {(team) => (
              <a
                href={`/${user.tiltifyName}/admin/teams/${team.id}`}
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 class="font-medium">{team.name}</h4>
                <p class="text-sm text-gray-500">{team.slug}</p>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const MemberTeamsList: Component = () => {
  const {local, user} = useUser();

  // Filter teams where the user is a member but not the owner
  const memberTeams = () => {
    return local.teamMembers.filter((m) => m.ownerId !== user.id);
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Teams You're In</h3>

      <Show when={memberTeams().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You're not a member of any teams yet.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={memberTeams()}>
            {(team) => (
              <a
                href={`/${user.tiltifyName}/admin/teams/${team.id}`}
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <h4 class="font-medium">{team.name}</h4>
                <p class="text-sm text-gray-500">{team.slug}</p>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

const InvitesList: Component = () => {
  const {local, acceptTeamInvite, rejectTeamInvite, action} = useUser();
  const [selectedTeamId, setSelectedTeamId] = createSignal<number | null>(null);
  const [isAcceptAction, setIsAcceptAction] = createSignal(false);
  const confirmDialog = createModalSignal();

  // Get team invites for the user
  const invites = () => local.invites || [];

  const openConfirmDialog = (teamId: number, isAccept: boolean) => {
    setSelectedTeamId(teamId);
    setIsAcceptAction(isAccept);
    confirmDialog.open();
  };

  const handleConfirm = async () => {
    const teamId = selectedTeamId();
    if (teamId === null) return;

    try {
      if (isAcceptAction()) {
        await acceptTeamInvite(teamId);
      } else {
        await rejectTeamInvite(teamId);
      }
      confirmDialog.close();
    } catch (error) {
      console.error(`Failed to ${isAcceptAction() ? 'accept' : 'reject'} invitation:`, error);
      // Error is already handled by the action state
    }
  };

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <h3 class="text-lg font-bold mb-4">Team Invitations</h3>

      <Show when={invites().length > 0} fallback={
        <p class="text-gray-500 text-center py-4">You don't have any team invitations.</p>
      }>
        <div class="flex flex-col gap-3">
          <For each={invites()}>
            {(invite) => (
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="mb-2">
                  <div class="text-sm text-gray-500">You've been invited to join:</div>
                  <h4 class="font-medium">{invite.name}</h4>
                </div>
                <div class="flex gap-2">
                  <button
                    onClick={() => openConfirmDialog(invite.teamId, true)}
                    class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => openConfirmDialog(invite.teamId, false)}
                    class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen()}
        onOpenChange={confirmDialog.setOpen}
        title={isAcceptAction() ? "Accept Team Invitation" : "Reject Team Invitation"}
        text={
          isAcceptAction()
            ? action.acceptTeamInvite.lastErrorMessage
              ? `Error: ${action.acceptTeamInvite.lastErrorMessage}`
              : "Are you sure you want to accept this invitation?"
            : action.rejectTeamInvite.lastErrorMessage
              ? `Error: ${action.rejectTeamInvite.lastErrorMessage}`
              : "Are you sure you want to reject this invitation?"
        }
        onConfirm={handleConfirm}
        onCancel={confirmDialog.close}
      />

      {/* Display loading indicators for the buttons in the invite list */}
      <Show when={action.acceptTeamInvite.actionInProgress || action.rejectTeamInvite.actionInProgress}>
        <div class="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-lg shadow-xl">
            <div class="flex items-center gap-2">
              <div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
              <span>{isAcceptAction() ? "Accepting invitation..." : "Rejecting invitation..."}</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
