import {
  FaRegularCircleCheck,
  FaRegularCircleXmark,
  FaSolidGear,
} from 'solid-icons/fa'
import { type Component, createEffect, createSignal, For, Show } from 'solid-js'
import { useAdminTeamDetail } from './AdminTeamDetailsProvider.tsx'
import { AdminHeading } from './AdminTeamMembersSection.tsx'
import { debounce } from '@solid-primitives/scheduled'
import { TextField } from '@kobalte/core/text-field'
import { useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../../../../lib/orpc/client.ts'
import { createSlug } from '../../../../../../lib/createSlug.ts'
import {
  Checkbox,
  fieldClass,
  TextField as UiTextField,
} from '../../../../../ui/Form'
import { Button } from '../../../../../ui/Button'
import { Alert, Spinner } from '../../../../../ui/Status'
import { cn } from '../../../../../ui/cn'

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
  const [description, setDescription] = createSignal('');

  const validateSlug = useQuery(() => orpcPrivate.teams.validateSlug.queryOptions({
    input: {
      slug: debounceSlug(),
      tiltifyName: team.data?.name
    },
    enabled: () => team.data !== undefined && createSlug(slug()).length > 0 && createSlug(slug()) !== team.data?.slug,
    staleTime: 30 * 1000,
  }))

  // Initialize form with team data
  createEffect(() => {
    if (team.data) {
      setName(team.data.name);
      setSlug(team.data.slug);
      setVisible(team.data.visible);
      setDescription(team.data.description || '');
    }
  });

  // Create debounced function for slug validation using oRPC
  const setSlugDebounce = debounce((slugValue: string) => {
    // The check uses the slug the server stores (F-59)
    const normalised = createSlug(slugValue)
    // If slug hasn't changed, it's valid
    if (team.data && normalised === team.data.slug) {
      return;
    }

    setDebounceSlug(normalised)

  }, 500);

  const handleNameChange = (value: string) => {
    setName(value);
  };


  const save = async () => {
    await updateTeam(name(), slug(), visible(), description().trim() === '' ? null : description());
  }

  const slugChanged = () => {
    if (!team.data) {
      return false
    }

    return team.data.slug !== createSlug(slug());
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
      || (name() === team.data.name && slug() === team.data.slug && visible() === team.data.visible && (description() === (team.data.description || '')))
      || slug() === ''
  }

  return (
    <div>
      <AdminHeading title="Team Settings" icon={FaSolidGear} />
      <div class="flex flex-col gap-4">
        <Show when={updateTeamMutation.isError}>
          <Alert tone="danger">
            {updateTeamMutation.failureReason?.message ||
              'Failed to save team settings'}
          </Alert>
        </Show>

        <UiTextField
          label="Team Name"
          value={name()}
          onChange={handleNameChange}
          placeholder="Enter team name..."
        />

        <TextField
          value={slug()}
          onChange={(s) => {
            setSlug(s)
            setSlugDebounce(s)
          }}
          // Red only for a changed slug that is checked and taken; the saved slug is fine as it is
          validationState={
            slugChanged() && !isCheckingSlug() && !slugValid()
              ? 'invalid'
              : 'valid'
          }
          class="flex flex-col gap-1"
        >
          <TextField.Label class={fieldClass.label}>Team Slug</TextField.Label>
          <div class="relative">
            <TextField.Input
              class={cn(fieldClass.input, 'h-10 pr-9')}
              placeholder="team-slug"
            />
            <div class="absolute top-1/2 right-3 flex -translate-y-1/2">
              <Show when={slugChanged() && isCheckingSlug()}>
                <Spinner class="text-accent" />
              </Show>
              <Show
                when={
                  slugChanged() && !isCheckingSlug() && slug() !== ''
                }
              >
                <Show
                  when={slugValid()}
                  fallback={
                    <FaRegularCircleXmark
                      class="text-danger size-4"
                      aria-hidden="true"
                    />
                  }
                >
                  <FaRegularCircleCheck
                    class="text-success size-4"
                    aria-hidden="true"
                  />
                </Show>
              </Show>
            </div>
          </div>
          <TextField.ErrorMessage class={fieldClass.error}>
            {slugErrorMessage()}
          </TextField.ErrorMessage>
          <Show when={suggestions().length > 0}>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class={fieldClass.help}>Suggestions:</span>
              <For each={suggestions()}>
                {(suggestion) => (
                  <button
                    type="button"
                    class="bg-accent-soft text-accent-text ring-accent-soft-line hover:bg-accent-soft-hover cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1"
                    onClick={() => setSlug(suggestion)}
                  >
                    {suggestion}
                  </button>
                )}
              </For>
            </div>
          </Show>
          <p class={fieldClass.help}>
            jinglejam.ostof.dev/teams/{slug() || 'your-team-slug'}
          </p>
        </TextField>

        <UiTextField
          label="Team Description"
          multiline
          value={description()}
          onChange={setDescription}
          placeholder="Describe your team..."
          description="Optional. A short description of your team."
        />

        <Checkbox
          label="Public Team"
          description="Public teams show in team listings and on member profiles."
          checked={visible()}
          onChange={(checked) => setVisible(checked)}
        />

        <div class="border-line flex justify-end border-t pt-3">
          <Button
            variant="accent"
            onClick={save}
            disabled={disableButton()}
            aria-label="Save team settings"
          >
            {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
