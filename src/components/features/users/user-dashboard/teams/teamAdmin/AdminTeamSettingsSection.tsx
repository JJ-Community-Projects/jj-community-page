import {FaRegularCircle, FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";
import {type Component, createEffect, createSignal, For, Show} from "solid-js";
import {useAdminTeamDetail} from "./AdminTeamDetailsProvider.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";

const Correct = () => {
  return (
    <FaRegularCircleCheck class={'text-green-500'} size={20}/>
  )
}
const Wrong = () => {
  return (
    <FaRegularCircleXmark class={'text-red-500'} size={20}/>
  )
}
const Loading = () => {
  return (
    <FaRegularCircle class={'text-blue-500'} size={20}/>
  )
}

// TeamSettings Component
export const AdminTeamSettingsSection: Component = () => {
  const {team, updateTeam, updateTeamMutation} = useAdminTeamDetail();

  // Form state signals
  const [name, setName] = createSignal('');
  const [slug, setSlug] = createSignal('');
  const [visible, setVisible] = createSignal(false);

  const validateSlug = useQuery(() => orpcPrivate.teams.validateSlug.queryOptions({
    input: {
      slug: slug(),
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

    setSlug(slugValue)

  }, 500);

  const handleNameChange = (value: string) => {
    setName(value);
  };


  const save = async () => {
    await updateTeam(name(), slug(), visible());
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
    const teamData = team.data;
    if (!teamData) return true;

    return (!validateSlug.data || !validateSlug.data.isValid) ||
      updateTeamMutation.isPending ||
      (name() === teamData.name && slug() === teamData.slug && visible() === teamData.visible) ||
      slug() === '' ||
      validateSlug.isPending;
  }


  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 flex flex-col gap-4">
      <Show when={updateTeamMutation.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{updateTeamMutation.failureReason?.message}</p>
        </div>
      </Show>

      <TextField
        value={name()}
        onChange={handleNameChange}
        class="flex-grow flex flex-col items-start gap-2 w-full">
        <TextField.Label class="w-full block text-sm font-medium text-gray-700 mb-1">Name</TextField.Label>
        <TextField.Input
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </TextField>

      <TextField
        value={slug()}
        onChange={setSlugDebounce}
        validationState={slugValid() ? "valid" : "invalid"}
        class="flex-grow flex flex-col items-start gap-2 w-full"
      >
        <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Slug</TextField.Label>
        <div class={'w-full flex flex-row items-center gap-4'}>
          <TextField.Input
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div class="">
            <Show when={isCheckingSlug()}>
              <Loading/>
            </Show>
            <Show when={!isCheckingSlug() && slugValid() && slug() !== ''}>
              <Correct/>
            </Show>
            <Show when={!isCheckingSlug() && !slugValid() && slug() !== ''}>
              <Wrong/>
            </Show>
          </div>
        </div>
        <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
          {slugErrorMessage()}
        </TextField.ErrorMessage>

        <Show when={suggestions().length > 0}>
          <div class="mt-2">
            <ul class="flex flex-wrap gap-2">
              <For each={suggestions()}>
                {(suggestion) => (
                  <li>
                    <button
                      type="button"
                      class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                      onClick={() => {
                        setSlug(suggestion);
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
      </TextField>
      <p class="text-xs text-gray-500 mt-1">
        This will be used in URLs: jj.ostof.dev/teams/{slug() || "your-team-slug"}
      </p>

      <Checkbox
        checked={visible()}
        onChange={(checked) => setVisible(checked)}
        class="flex items-start mt-4"
      >
        <Checkbox.Input class="sr-only"/>
        <Checkbox.Control
          class="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white data-[checked]:bg-accent data-[checked]:border-accent">
          <Checkbox.Indicator>
            <FaRegularCircleCheck class="text-white" size={14}/>
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="ml-2 text-sm font-medium">Team Visible</Checkbox.Label>
        <Checkbox.Description class="text-xs text-gray-500 ml-2">
          When checked, this team will be publicly visible in team listings and searchable.
        </Checkbox.Description>
      </Checkbox>

      <button
        class="bg-accent hover:bg-accent-400 text-white px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        onClick={save}
        disabled={disableButton()}
      >
        {updateTeamMutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
};
