import {type Component, createSignal, createUniqueId, Show} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {Dialog} from "../../../../../ui/Dialog";
import {Button} from "../../../../../ui/Button";
import {TextField} from "../../../../../ui/Form";
import {Alert} from "../../../../../ui/Status";
import {SlugField} from "../../common/SlugField.tsx";
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import {orpcPrivate} from "../../../../../../lib/orpc/client.ts";
import {createSlug} from "../../../../../../lib/createSlug.ts";

export const CreateTeamDialog: Component<{ isOpen: () => boolean, setIsOpen: (open: boolean) => void }> = (props) => {
  // The submit button sits in the dialog footer, outside the form
  const formId = createUniqueId();
  // Form state signals
  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  // The slug as the server stores it (F-59): what gets checked, created and shown in the URL
  const normalizedSlug = () => createSlug(slug());
  // What the server checks: slug and name 500 ms after the last keystroke in either field
  const [checked, setChecked] = createSignal({slug: "", name: ""});
  const client = useQueryClient()

  // Slug validation query
  const validateSlug = useQuery(() => orpcPrivate.teams.validateSlug.queryOptions({
    input: {
      slug: checked().slug,
      tiltifyName: checked().name
    },
    enabled: () => checked().slug.length > 0,
    staleTime: 30 * 1000,
  }));

  // oRPC mutations
  const createTeamMutation = useMutation(() =>
    orpcPrivate.teams.create.mutationOptions({
      onSuccess: async () => {
        props.setIsOpen(false);
        // Reset form
        setName("");
        setSlug("");
        setCheckedNow("");
        await client.invalidateQueries({
          queryKey:orpcPrivate.teams.canCreateTeam.queryKey(),
        })
        await client.invalidateQueries({
          queryKey:orpcPrivate.teams.canInviteCurrentUser.queryKey(),
        })
      }
    })
  );

  // Validation helper functions
  const isCheckingSlug = () => {
    return validateSlug.isPending || checked().slug !== normalizedSlug();
  };

  const slugValid = () => {
    if (!validateSlug.data || checked().slug !== normalizedSlug()) {
      return false;
    }
    return validateSlug.data.isValid;
  };

  const slugErrorMessage = () => {
    return validateSlug.error?.message;
  };

  const suggestions = () => {
    if (!validateSlug.data) {
      return [];
    }
    return validateSlug.data.suggestions;
  };

  // Create debounced function for the checked slug and name
  const setCheckedDebounce = debounce(setChecked, 500);

  const setCheckedNow = (slugValue: string) => {
    setCheckedDebounce.clear();
    setChecked({slug: slugValue, name: name()});
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    const generatedSlug = createSlug(value);
    setSlug(generatedSlug);
    setCheckedDebounce({slug: generatedSlug, name: value});
  };

  const handleSlugChange = (value: string) => {
    // Typing keeps hyphens where they are; the check and the URL use the normalised slug
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlug(sanitizedSlug);
    setCheckedDebounce({slug: createSlug(sanitizedSlug), name: name()});
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name() || !slug() || !slugValid()) {
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: name(),
        slug: normalizedSlug()
      });
    } catch (error) {
      console.error("Failed to create team:", error);
      // Error is already handled by the mutation state
    }
  };

  return (
    <Dialog
      open={props.isOpen()}
      onOpenChange={props.setIsOpen}
      title="Create New Team"
      description="Create a new team to collaborate with others on JingleJam schedules."
      footer={
        <>
          <Button size="sm" onClick={() => props.setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            size="sm"
            variant="accent"
            disabled={
              !name() || !slug() || !slugValid() || createTeamMutation.isPending
            }
          >
            {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} class="flex flex-col gap-4">
        <TextField
          label="Team Name"
          value={name()}
          onChange={handleNameChange}
          placeholder="My Awesome Team"
        />

        <SlugField
          label="Team Slug"
          value={slug()}
          onChange={handleSlugChange}
          placeholder="my-awesome-team"
          checking={isCheckingSlug() && slug().length > 0}
          valid={slugValid()}
          error={
            slugErrorMessage() ||
            (!slugValid() && slug().length > 0
              ? 'This slug is not available. Try one of these suggestions:'
              : undefined)
          }
          suggestions={suggestions()}
          onPick={(suggestion) => {
            setSlug(suggestion)
            setCheckedNow(suggestion)
          }}
          path="teams"
          normalized={normalizedSlug()}
        />

        <Show when={createTeamMutation.isError}>
          <Alert tone="danger">
            {createTeamMutation.failureReason?.message}
          </Alert>
        </Show>
      </form>
    </Dialog>
  )
}
