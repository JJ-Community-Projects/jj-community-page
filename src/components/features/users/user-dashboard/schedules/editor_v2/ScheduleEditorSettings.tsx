import { type Component, Show, createEffect, createSignal } from "solid-js";
import { useScheduleEditor2 } from "./ScheduleEditorProvider.tsx";
import { debounce } from "@solid-primitives/scheduled";
import { TextField } from "@kobalte/core/text-field";
import { useQuery } from "@tanstack/solid-query";
import { orpcPrivate } from "../../../../../../lib/orpc/client.ts";
import { useEditableField } from "../../../../../../lib/utils/useEditableField";
import { Section } from "../../../../../ui/Tile";
import { Checkbox, fieldClass } from "../../../../../ui/Form";
import { Alert, Spinner } from "../../../../../ui/Status";
import { cn } from "../../../../../ui/cn";
import { SlugField } from "../../common/SlugField";

export const ScheduleEditorSettings: Component = () => {
  const { state, updateMeta, updateMetaMutation } = useScheduleEditor2();

  // Identity accessor so the helpers know when we’re looking at a different schedule
  const scheduleId = () => state.schedule?.id;

  // Title field managed by useEditableField: saved on blur or Enter, only when it changed
  const titleField = useEditableField<string>({
    source: () => state.schedule?.title,
    identity: scheduleId,
    commit: async (title) => {
      if (!state.schedule) return;
      const trimmed = typeof title === "string" ? title.trim() : (title as unknown as string);
      if (!trimmed || trimmed === state.schedule.title) return;
      await updateMeta({ scheduleId: state.schedule.id, title: trimmed });
    },
    commitOn: "blur",
  });

  // Year field with parse/format, saved on blur or Enter
  const yearField = useEditableField<number>({
    source: () => state.schedule?.year,
    identity: scheduleId,
    parse: (s) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : (undefined as unknown as number);
    },
    format: (v) => (typeof v === "number" && Number.isFinite(v) ? String(v) : ""),
    commit: async (year) => {
      if (!state.schedule) return;
      if (!Number.isFinite(year) || year === state.schedule.year) return;
      await updateMeta({ scheduleId: state.schedule.id, year });
    },
    commitOn: "blur",
  });

  // Slug field and separate debounced value for validation
  const [slugForValidation, setSlugForValidation] = createSignal("");
  const slugField = useEditableField<string>({
    source: () => state.schedule?.slug,
    identity: scheduleId,
    // Do not updateMeta directly on input changes; we'll validate first and then update in an effect
    commit: async (_slug) => {
      // no-op: validation effect will perform updateMeta when valid
    },
    debounceMs: 400,
  });

  const debouncedSetValidation = debounce((s: string) => {
    const sanitized = s.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlugForValidation(sanitized);
  }, 500);
  createEffect(() => {
    const s = slugField.inputValue() ?? "";
    debouncedSetValidation(s);
  });


  // Slug validation query (enabled only when slug differs and not empty)
  const validateSlug = useQuery(() =>
    orpcPrivate.schedules.validateSlug.queryOptions({
      input: {
        slug: slugForValidation(),
      },
      enabled: () =>
        Boolean(state.schedule) && !!slugForValidation() && slugForValidation() !== (state.schedule?.slug ?? ""),
      staleTime: 30 * 1000,
    })
  );

  // Visible toggle remains debounced
  const updateVisibleDebounced = debounce((checked: boolean) => {
    if (!state.schedule) return;
    void updateMeta({ scheduleId: state.schedule.id, visible: checked });
  }, 200);

  const applySlug = (nextSlug: string) => {
    // Apply suggestion to input; validation effect will handle updateMeta if valid
    slugField.setValue(nextSlug);
  };

  const isCheckingSlug = () => {
    return validateSlug.isPending;
  };

  const slugValid = () => {
    const current = slugField.value() ?? "";
    if (current.length === 0) return false;
    if (!validateSlug.data) return false;
    return validateSlug.data.isValid;
  };

  const slugErrorMessage = () => {
    return validateSlug.error?.message;
  };

  const suggestions = () => {
    if (!validateSlug.data) return [] as string[];
    return validateSlug.data.suggestions ?? [];
  };

  const hasEditedSlug = () => {
    const original = state.schedule?.slug ?? "";
    const current = slugField.inputValue() ?? "";
    return current.length > 0 && current !== original;
  };

  // Track the last slug we applied to avoid duplicate updates
  const [lastAppliedSlug, setLastAppliedSlug] = createSignal<string | null>(null);

  // Reset tracker when schedule changes
  createEffect(() => {
    const id = state.schedule?.id; // dependency
    if (id === undefined) {
      setLastAppliedSlug(null);
    } else {
      setLastAppliedSlug(state.schedule?.slug ?? null);
    }
  });

  // When user edits slug and validation says it's valid, updateMeta with the sanitized slug
  createEffect(() => {
    if (!state.schedule) return;
    if (!hasEditedSlug()) return;
    if (isCheckingSlug()) return;
    const data = validateSlug.data;
    if (!data || !data.isValid) return;
    const target = slugForValidation();
    if (!target) return;
    if (lastAppliedSlug() === target) return;
    void updateMeta({ scheduleId: state.schedule.id, slug: target });
    setLastAppliedSlug(target);
  });

  const slugError = () =>
    !isCheckingSlug() && hasEditedSlug()
      ? slugErrorMessage() || (!slugValid() ? "This slug is not available. Try one of these suggestions:" : undefined)
      : undefined;

  return (
    <Section
      title="Schedule Settings"
      action={
        <Show when={updateMetaMutation.status === 'pending'}>
          <Spinner class="text-fg-muted text-xs" label="Saving…" />
        </Show>
      }
    >
      <Show when={!state.schedule}>
        <p class="text-fg-muted text-sm">Loading schedule...</p>
      </Show>

      {/* Important: don’t key this block by the whole schedule object; use boolean */}
      <Show when={!!state.schedule}>
        <div class="flex flex-col gap-4">
          {/* Error from updateMeta */}
          <Show when={updateMetaMutation.isError}>
            <Alert tone="danger">{updateMetaMutation.error?.message}</Alert>
          </Show>

          {/* Title + Year */}
          <div class="grid grid-cols-[1fr_6rem] gap-3 sm:grid-cols-[1fr_8rem]">
            <TextField name="title" class="flex min-w-0 flex-col gap-1" validationState="valid">
              <TextField.Label class={fieldClass.label}>Title:</TextField.Label>
              <TextField.Input
                class={cn(fieldClass.input, 'h-10')}
                value={titleField.inputValue()}
                onInput={(e) => titleField.onInput(e.currentTarget.value)}
                onKeyDown={(e) => titleField.onKeyDown(e)}
                onFocus={() => titleField.setFocused(true)}
                onBlur={() => titleField.onBlur()}
              />
            </TextField>

            <TextField name="year" class="flex flex-col gap-1" validationState="valid">
              <TextField.Label class={fieldClass.label}>Year:</TextField.Label>
              <TextField.Input
                type="number"
                class={cn(fieldClass.input, 'h-10')}
                value={yearField.inputValue()}
                onInput={(e) => yearField.onInput(e.currentTarget.value)}
                onKeyDown={(e) => yearField.onKeyDown(e)}
                onFocus={() => yearField.setFocused(true)}
                onBlur={() => yearField.onBlur()}
                inputmode="numeric"
              />
            </TextField>
          </div>

          {/* Slug: focus is tracked on the wrapper, so live updates don't overwrite what's being typed */}
          <div onFocusIn={() => slugField.setFocused(true)} onFocusOut={() => slugField.setFocused(false)}>
            <SlugField
              label="Slug:"
              value={slugField.inputValue() ?? ""}
              onChange={(v) => slugField.onInput(v.toLowerCase())}
              placeholder="your-schedule-slug"
              checking={isCheckingSlug() && hasEditedSlug()}
              valid={!hasEditedSlug() || slugValid()}
              error={slugError()}
              suggestions={hasEditedSlug() ? suggestions() : []}
              onPick={applySlug}
              path="schedules"
              normalized={slugField.value() ?? ""}
            />
          </div>

          {/* Visible */}
          <Checkbox
            name="visible"
            label="Schedule Visible"
            description="When checked, this schedule will be publicly visible."
            checked={state.schedule!.visible}
            onChange={updateVisibleDebounced}
            disabled={updateMetaMutation.isPending}
          />
        </div>
      </Show>
    </Section>
  );
};

export default ScheduleEditorSettings;
