import { type Component, Show, createEffect, createSignal } from "solid-js";
import { useScheduleEditor2 } from "./ScheduleEditorProvider.tsx";
import { debounce } from "@solid-primitives/scheduled";
import { TextField } from "@kobalte/core/text-field";
import { Checkbox } from "@kobalte/core/checkbox";
import { useQuery } from "@tanstack/solid-query";
import { orpcPrivate } from "../../../../../../lib/orpc/client.ts";
import { useEditableField } from "../../../../../../lib/utils/useEditableField";

import { FaSolidCheck } from "solid-icons/fa";

export const ScheduleEditorSettings: Component = () => {
  const { state, updateMeta, updateMetaMutation } = useScheduleEditor2();

  // Identity accessor so the helpers know when we’re looking at a different schedule
  const scheduleId = () => state.schedule?.id;

  // Title field managed by useEditableField
  const titleField = useEditableField<string>({
    source: () => state.schedule?.title,
    identity: scheduleId,
    commit: async (title) => {
      if (!state.schedule) return;
      const trimmed = typeof title === "string" ? title.trim() : (title as unknown as string);
      if (!trimmed) return;
      await updateMeta({ scheduleId: state.schedule.id, title: trimmed });
    },
    debounceMs: 250,
  });

  // Year field with parse/format
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
      if (!Number.isFinite(year)) return;
      await updateMeta({ scheduleId: state.schedule.id, year });
    },
    debounceMs: 250,
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
        id: state.schedule?.id ?? 0,
        slug: slugForValidation(),
        title: state.schedule?.title ?? "",
      },
      enabled: () =>
        Boolean(state.schedule) && !!slugForValidation() && slugForValidation() !== (state.schedule?.slug ?? ""),
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

  return (
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">Schedule Settings</h2>
        <Show when={updateMetaMutation.status === 'pending'}>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span class="inline-block h-2 w-2 rounded-full bg-accent animate-pulse"></span>
            <span>Saving…</span>
          </div>
        </Show>
      </div>

      <Show when={!state.schedule}>
        <div class="text-sm text-gray-600">Loading schedule...</div>
      </Show>

      {/* Important: don’t key this block by the whole schedule object; use boolean */}
      <Show when={!!state.schedule}>
        <div class="grid grid-cols-1 gap-4">
          {/* Error from updateMeta */}
          <Show when={updateMetaMutation.isError}>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {updateMetaMutation.error?.message}
            </div>
          </Show>

          {/* Title + Year */}
          <div class="flex gap-4">
            <TextField name="title" class="flex flex-col flex-grow" validationState="valid">
              <TextField.Label class="text-sm font-medium mb-1">Title:</TextField.Label>
              <div class="relative">
                <TextField.Input
                  class="border border-gray-300 rounded-lg px-3 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  value={titleField.inputValue()}
                  onInput={(e) => titleField.onInput(e.currentTarget.value)}
                  onFocus={() => titleField.setFocused(true)}
                  onBlur={() => titleField.setFocused(false)}
                />
                <Show when={updateMetaMutation.isPending}>
                  <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                  </div>
                </Show>
              </div>
            </TextField>

            <TextField name="year" class="flex flex-col w-1/3" validationState="valid">
              <TextField.Label class="text-sm font-medium mb-1">Year:</TextField.Label>
              <TextField.Input
                type="number"
                class="border border-gray-300 rounded-lg px-3 py-2"
                value={yearField.inputValue()}
                onInput={(e) => yearField.onInput(e.currentTarget.value)}
                onFocus={() => yearField.setFocused(true)}
                onBlur={() => yearField.setFocused(false)}
                inputmode="numeric"
              />
            </TextField>
          </div>

          {/* Slug */}
          <TextField name="slug" class="flex flex-col" validationState={hasEditedSlug() ? (slugValid() ? "valid" : "invalid") : "valid"}>
            <TextField.Label class="text-sm font-medium mb-1">Slug:</TextField.Label>
            <div class="relative">
              <TextField.Input
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                value={slugField.inputValue()}
                onInput={(e) => slugField.onInput(e.currentTarget.value.toLowerCase())}
                onFocus={() => slugField.setFocused(true)}
                onBlur={() => slugField.setFocused(false)}
              />
              <Show when={isCheckingSlug() && hasEditedSlug()}>
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                </div>
              </Show>
              <Show when={!isCheckingSlug() && hasEditedSlug() && slugValid()}>
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <FaSolidCheck class={'text-success'} size={16}/>
                </div>
              </Show>
            </div>
            <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
              {!isCheckingSlug() && hasEditedSlug() ? (slugErrorMessage() || (!slugValid() ? "This slug is not available. Try one of these suggestions:" : undefined)) : undefined}
            </TextField.ErrorMessage>

            <Show when={hasEditedSlug() && suggestions().length > 0}>
              <div class="mt-2">
                <ul class="flex flex-wrap gap-2">
                  {suggestions().map((suggestion: string) => (
                    <li>
                      <button
                        type="button"
                        class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                        onClick={() => applySlug(suggestion)}
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Show>

            <p class="text-xs text-gray-500 mt-1">
              This will be used in the URL: /schedules/{slugField.value() || "your-schedule-slug"}
            </p>
          </TextField>

          {/* Visible */}
          <Checkbox
            name="visible"
            class="items-center inline-flex cursor-pointer"
            checked={state.schedule!.visible}
            onChange={updateVisibleDebounced}
            disabled={updateMetaMutation.isPending}
          >
            <Checkbox.Input class="sr-only" />
            <Checkbox.Control class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
              <Checkbox.Indicator>
                <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
                  <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2" />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label class="ml-2 text-sm font-medium">Schedule Visible</Checkbox.Label>
            <Checkbox.Description class="text-xs text-gray-500 ml-2">
              When checked, this schedule will be publicly visible.
            </Checkbox.Description>
          </Checkbox>
        </div>
      </Show>
    </div>
  );
};

export default ScheduleEditorSettings;
