import {type Component, createSignal, createUniqueId, Show} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {TextField as KTextField} from "@kobalte/core/text-field";
import {Dialog} from "../../../../ui/Dialog";
import {Button} from "../../../../ui/Button";
import {Checkbox, fieldClass, TextField} from "../../../../ui/Form";
import {Alert} from "../../../../ui/Status";
import {cn} from "../../../../ui/cn";
import {SlugField} from "../common/SlugField.tsx";
import {useMutation, useQuery} from "@tanstack/solid-query";
import {orpcPrivate} from "../../../../../lib/orpc/client.ts";
import {createSlug} from "../../../../../lib/createSlug.ts";
import {DateTime} from "luxon";
import { FaSolidCheck } from 'solid-icons/fa'

export const CreateScheduleDialog: Component<{
  isOpen: () => boolean,
  setIsOpen: (open: boolean) => void,
  onSuccess?: () => Promise<void> | void
}> = (props) => {
  // The submit button sits in the dialog footer, outside the form
  const formId = createUniqueId();
  // Form state signals
  const [name, setName] = createSignal("");
  const [slug, setSlug] = createSignal("");
  const [debounceSlug, setDebounceSlug] = createSignal<string>('')
  // The slug as the server stores it (F-59): what gets checked, created and shown in the URL
  const normalizedSlug = () => createSlug(slug());

  const [primary, setPrimary] = createSignal(false);
  const [year, setYear] = createSignal(DateTime.now().year);

  // Slug validation query, on the slug 500 ms after the last keystroke in the name or slug field
  const validateSlug = useQuery(() => orpcPrivate.schedules.validateSlug.queryOptions({
    input: {
      slug: debounceSlug(),
    },
    enabled: () => debounceSlug().length > 0,
    staleTime: 30 * 1000,
  }));

  // oRPC mutations
  const createScheduleMutation = useMutation(() =>
    orpcPrivate.schedules.createWithDetails.mutationOptions({
      onSuccess: async () => {
        props.setIsOpen(false);
        // Reset form
        setName("");
        setSlug("");
        setSlugDebounce.clear();
        setDebounceSlug("");
        setPrimary(false);
        setYear(DateTime.now().year);
        // Call the onSuccess callback if provided
        if (props.onSuccess) {
          await props.onSuccess();
        }
      }
    })
  );

  // Validation helper functions
  const isCheckingSlug = () => {
    return validateSlug.isPending || debounceSlug() !== normalizedSlug();
  };

  const slugValid = () => {
    if (!validateSlug.data || debounceSlug() !== normalizedSlug()) {
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

  // Create debounced function for the checked slug
  const setSlugDebounce = debounce(setDebounceSlug, 500);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name if user hasn't manually edited the slug
    const generatedSlug = createSlug(value);
    setSlug(generatedSlug);
    setSlugDebounce(generatedSlug);
  };

  const handleSlugChange = (value: string) => {
    // Typing keeps hyphens where they are; the check and the URL use the normalised slug
    const sanitizedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlug(sanitizedSlug);
    setSlugDebounce(createSlug(sanitizedSlug));
  };

  const handleYearChange = (value: string) => {
    const yearValue = parseInt(value);
    if (!isNaN(yearValue)) {
      setYear(yearValue);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!name() || !slug() || !slugValid()) {
      return;
    }

    try {
      await createScheduleMutation.mutateAsync({
        name: name(),
        slug: normalizedSlug(),
        primary: primary(),
        year: year()
      });
    } catch (error) {
      console.error("Failed to create schedule:", error);
      // Error is already handled by the mutation state
    }
  };

  return (
    <Dialog
      open={props.isOpen()}
      onOpenChange={props.setIsOpen}
      title="Create New Schedule"
      description="Create a new schedule to organize your streams and events."
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
              !name() ||
              !slug() ||
              !slugValid() ||
              createScheduleMutation.isPending
            }
          >
            {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} class="flex flex-col gap-4">
        <TextField
          label="Schedule Name"
          value={name()}
          onChange={handleNameChange}
          placeholder="My Awesome Schedule 2025"
        />

        <SlugField
          label="Schedule Slug"
          value={slug()}
          onChange={handleSlugChange}
          placeholder="my-awesome-schedule-2025"
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
            setSlugDebounce.clear()
            setDebounceSlug(suggestion)
          }}
          path="schedules"
          normalized={normalizedSlug()}
        />

        <KTextField
          value={year().toString()}
          onChange={handleYearChange}
          class="flex flex-col gap-1"
        >
          <KTextField.Label class={fieldClass.label}>Year</KTextField.Label>
          <KTextField.Input
            type="number"
            min="2020"
            max="2030"
            class={cn(fieldClass.input, 'h-10')}
            placeholder="2025"
          />
        </KTextField>

        <Checkbox
          label={`Set as primary schedule for ${year()}`}
          checked={primary()}
          onChange={setPrimary}
        />

        <Show when={createScheduleMutation.isError}>
          <Alert tone="danger">
            {createScheduleMutation.failureReason?.message}
          </Alert>
        </Show>
      </form>
    </Dialog>
  )
}
