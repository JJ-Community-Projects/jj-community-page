import {FaRegularCircle, FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";
import {type Component, createEffect, For, Show} from "solid-js";
import {useTeamDetail} from "../../providers/TeamDetailsProvider.tsx";
import {useUser} from "../../providers/UserProvider.tsx";
import {createStore} from "solid-js/store";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";

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
  const {local, updateTeam, action} = useTeamDetail();
  const {isTeamSlugUnique} = useUser();


  const [state, setState] = createStore<{
    name: string,
    slug: string,
    slugValid: boolean,
    errorMessage?: string,
    isCheckingSlug: boolean,
    suggestions: string[]
  }>({
    name: local.name,
    slug: local.slug,
    slugValid: true,
    isCheckingSlug: false,
    suggestions: []
  })

  createEffect(() => {
    setState('name', local.name);
    setState('slug', local.slug);
    setState('suggestions', []);
    setState('slugValid', true);
  })

  const slugErrorMessage = () => {
    if (state.errorMessage) {
      return state.errorMessage;
    } else if (!state.slugValid) {
      return 'This slug is not available. Try one of these suggestions:';
    }
    return undefined;
  }

  // Create debounced function for slug validation
  const checkSlugUnique = debounce(async (slug: string) => {
    // If slug hasn't changed, it's valid
    if (slug === local.slug) {
      return;
    }

    if (!slug) {
      setState('errorMessage', 'Slug is required');
      setState('suggestions', []);
      return;
    }

    setState('isCheckingSlug', true);
    setState('errorMessage', undefined);
    setState('suggestions', []);

    try {
      const {data, error} = await isTeamSlugUnique(slug);
      if (error) {
        console.error(error);
        setState('slugValid', false);
        setState('errorMessage', 'Error checking slug availability');
      } else {
        setState('slugValid', data.isValid);
        setState('suggestions', data.suggestions || []);
        setState('errorMessage', data.isValid ? undefined : 'This slug is not available. Try one of these suggestions:');
      }
    } catch (error) {
      console.error("Error checking slug:", error);
      setState('slugValid', false);
      setState('errorMessage', 'Error checking slug availability');
      setState('suggestions', []);
    } finally {
      setState('isCheckingSlug', false);
    }
  }, 500);

  const handleNameChange = (value: string) => {
    setState('name', value);
  };

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setState('slug', sanitizedSlug);
    setState('isCheckingSlug', true);
    checkSlugUnique(sanitizedSlug);
  };


  const save = async () => {
    await updateTeam(state.name, state.slug);
  }

  const disableButton = () => {
    // Disable button if:
    // 1. Slug is not valid
    // 2. Action is in progress
    // 3. No changes have been made
    // 4. slug is empty
    return !state.slugValid ||
      action.updateTeam.actionInProgress ||
      (state.name === local.name && state.slug === local.slug) ||
      state.slug === '' ||
      state.isCheckingSlug;
  }

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6 flex flex-col gap-4">
      <Show when={action.updateTeam.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{action.updateTeam.lastErrorMessage}</p>
        </div>
      </Show>

      <TextField
        value={state.name}
        onChange={handleNameChange}
        class="flex-grow flex flex-col items-start gap-2 w-full">
        <TextField.Label class="w-full block text-sm font-medium text-gray-700 mb-1">Name</TextField.Label>
        <TextField.Input
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </TextField>

      <TextField
        value={state.slug}
        onChange={handleSlugChange}
        validationState={state.slugValid ? "valid" : "invalid"}
        class="flex-grow flex flex-col items-start gap-2 w-full"
      >
        <TextField.Label class="block text-sm font-medium text-gray-700 mb-1">Slug</TextField.Label>
        <div class={'w-full flex flex-row items-center gap-4'}>
          <TextField.Input
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div class="">
            <Show when={state.isCheckingSlug}>
              <Loading/>
            </Show>
            <Show when={!state.isCheckingSlug && state.slugValid && state.slug !== ''}>
              <Correct/>
            </Show>
            <Show when={!state.isCheckingSlug && !state.slugValid && state.slug !== ''}>
              <Wrong/>
            </Show>
          </div>
        </div>
        <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
          {slugErrorMessage()}
        </TextField.ErrorMessage>

        <Show when={state.suggestions.length > 0}>
          <div class="mt-2">
            <ul class="flex flex-wrap gap-2">
              <For each={state.suggestions}>
                {(suggestion) => (
                  <li>
                    <button
                      type="button"
                      class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                      onClick={() => {
                        setState('slug', suggestion);
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
      </TextField>
      <p class="text-xs text-gray-500 mt-1">
        This will be used in URLs: jj.ostof.dev/teams/{state.slug || "your-team-slug"}
      </p>
      <button
        class="bg-accent hover:bg-accent-400 text-white px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        onClick={save}
        disabled={disableButton()}
      >
        {action.updateTeam.actionInProgress ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
};
