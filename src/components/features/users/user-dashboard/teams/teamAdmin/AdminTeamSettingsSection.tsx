import {FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";
import {type Component, createEffect, createSignal, For, Show} from "solid-js";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";
import {MutationDebugger} from "../../../../../common/MutationDebugger.tsx";
import {QueryDebugger} from "../../../../../common/QueryDebugger.tsx";

/**
 * AdminTeamSettingsSection Component
 *
 * Team settings form with real-time validation and modern design.
 * Enhanced with design system colors and consistent styling patterns.
 */
export const AdminTeamSettingsSection: Component = () => {
  const {team, updateTeam, updateTeamMutation} = useAdminTeamDetail();

  // Form state signals
  const [name, setName] = createSignal('');
  const [slug, setSlug] = createSignal('');
  const [debounceSlug, setDebounceSlug] = createSignal<string>('')

  const [visible, setVisible] = createSignal(false);

  const validateSlug = useQuery(() => orpcPrivate.teams.validateSlug.queryOptions({
    input: {
      slug: debounceSlug(),
      tiltifyName: team.data?.name
    },
    enabled: () => team.data !== undefined && slug().length > 0 && slug() !== team.data?.slug,
  }))

  // Initialize form with team data
  createEffect(() => {
    if (team.data) {
      setName(team.data.name);
      setSlug(team.data.slug);
      setVisible(team.data.visible);
    }
  });

  // Create debounced function for slug validation using oRPC
  const setSlugDebounce = debounce((slugValue: string) => {
    // If slug hasn't changed, it's valid
    if (team.data && slugValue === team.data.slug) {
      return;
    }

    setDebounceSlug(slugValue)

  }, 500);

  const handleNameChange = (value: string) => {
    setName(value);
  };


  const save = async () => {
    await updateTeam(name(), slug(), visible());
  }

  const slugChanged = () => {
    if (!team.data) {
      return false
    }

    return team.data.slug !== slug();
  }

  const isCheckingSlug = () => {
    return validateSlug.isPending
  }

  const slugValid = () => {
    if (!validateSlug.data) {
      return false
    }
    return validateSlug.data.isValid
  }

  const slugErrorMessage = () => {
    return validateSlug.error?.message
  }

  const suggestions = () => {
    if (!validateSlug.data) {
      return []
    }

    return validateSlug.data.suggestions
  }

  const disableButton = () => {
    // Disable button if:
    // 1. Slug is not valid
    // 2. Mutation is in progress
    // 3. No changes have been made (name, slug, or visibility)
    // 4. slug is empty
    // 5. Currently checking slug
    if (!team.data) return true;

    return (updateTeamMutation.isPending && slug() === team.data.slug)
      || (name() === team.data.name && slug() === team.data.slug && visible() === team.data.visible)
      || slug() === ''
  }

  return (
    <div class="space-y-6">

      <MutationDebugger mutation={updateTeamMutation}/>

      <QueryDebugger query={team}/>

      {/* Section Header */}
      <div class="flex items-center gap-3">
        <h4 class="text-sm font-semibold text-gray-800">Team Settings</h4>
      </div>

      {/* Error Message */}
      <Show when={updateTeamMutation.isError}>
        <div class="bg-danger-50 rounded-xl p-4 border border-danger-200">
          <div class="flex items-center gap-3 text-danger-600">
            <FaRegularCircleXmark class="w-4 h-4 flex-shrink-0"/>
            <p
              class="text-sm font-medium">{updateTeamMutation.failureReason?.message || "Failed to save team settings"}</p>
          </div>
        </div>
      </Show>

      {/* Team Name Field */}
      <TextField
        value={name()}
        onChange={handleNameChange}
        class="space-y-2">
        <TextField.Label class="block text-sm font-medium text-gray-700">Team Name</TextField.Label>
        <TextField.Input
          class="
            w-full px-4 py-3 rounded-xl border-2 border-gray-200
            focus:border-accent focus:ring-4 focus:ring-accent/20
            transition-all duration-300 outline-none
            bg-white/50 backdrop-blur-sm hover:bg-white/70
            text-gray-800 font-medium
            shadow-sm hover:shadow-md focus:shadow-lg
          "
          placeholder="Enter team name..."
        />
      </TextField>

      {/* Team Slug Field */}
      <TextField
        value={slug()}
        onChange={(s) => {
          setSlug(s);
          setSlugDebounce(s)
        }}
        validationState={slugValid() ? "valid" : "invalid"}
        class="space-y-2"
      >
        <TextField.Label class="block text-sm font-medium text-gray-700">Team Slug</TextField.Label>
        <div class="relative">
          <TextField.Input
            class="
              w-full pl-4 pr-12 py-3 rounded-xl border-2 border-gray-200
              focus:border-accent focus:ring-4 focus:ring-accent/20
              transition-all duration-300 outline-none
              bg-white/50 backdrop-blur-sm hover:bg-white/70
              text-gray-800 font-medium
              shadow-sm hover:shadow-md focus:shadow-lg
            "
            placeholder="team-slug"
          />

          {/* Status Indicator */}
          <div class="absolute inset-y-0 right-0 pr-4 flex items-center">
            <Show when={slugChanged() && isCheckingSlug()}>
              <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </Show>
            <Show when={slugChanged() && !isCheckingSlug() && slugValid() && slug() !== ''}>
              <FaRegularCircleCheck class="w-5 h-5 text-success"/>
            </Show>
            <Show when={slugChanged() && !isCheckingSlug() && !slugValid() && slug() !== ''}>
              <FaRegularCircleXmark class="w-5 h-5 text-danger"/>
            </Show>
          </div>
        </div>

        <TextField.ErrorMessage class="text-danger text-sm">
          {slugErrorMessage()}
        </TextField.ErrorMessage>

        {/* Slug Suggestions */}
        <Show when={suggestions().length > 0}>
          <div class="space-y-2">
            <p class="text-xs text-gray-600">Suggestions:</p>
            <div class="flex flex-wrap gap-2">
              <For each={suggestions()}>
                {(suggestion) => (
                  <button
                    type="button"
                    class="
                      px-3 py-1.5 text-sm bg-accent/10 text-accent hover:bg-accent/20
                      rounded-lg transition-colors duration-200
                      border border-accent/20 hover:border-accent/30
                    "
                    onClick={() => setSlug(suggestion)}
                  >
                    {suggestion}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* URL Preview */}
        <p class="text-xs text-gray-500 flex items-center gap-1">
          <span>Preview:</span>
          <span class="font-mono bg-gray-100 px-2 py-1 rounded">
            jj.ostof.dev/teams/{slug() || "your-team-slug"}
          </span>
        </p>
      </TextField>

      {/* Team Visibility Toggle */}
      <Checkbox
        checked={visible()}
        onChange={(checked) => setVisible(checked)}
        class="flex items-start gap-3"
      >
        <Checkbox.Input class="sr-only"/>
        <Checkbox.Control class="
          flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300
          bg-white data-[checked]:bg-accent data-[checked]:border-accent
          transition-all duration-200 hover:border-gray-400
        ">
          <Checkbox.Indicator>
            <FaRegularCircleCheck class="text-white w-3 h-3"/>
          </Checkbox.Indicator>
        </Checkbox.Control>
        <div class="flex-1">
          <Checkbox.Label class="text-sm font-medium text-gray-800">Public Team</Checkbox.Label>
          <Checkbox.Description class="text-xs text-gray-600 mt-1">
            When enabled, this team will be publicly visible in team listings and searchable by other users.
          </Checkbox.Description>
        </div>
      </Checkbox>

      {/* Save Button */}
      <div class="flex justify-end pt-4 border-t border-gray-200">
        <button
          class="
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200
            bg-accent hover:bg-accent-600 text-white font-medium
            focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white
            outline-none shadow-sm hover:shadow-md active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          onClick={save}
          disabled={disableButton()}
          aria-label="Save team settings"
        >
          {updateTeamMutation.isPending ? (
            <>
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </div>
  )
};
