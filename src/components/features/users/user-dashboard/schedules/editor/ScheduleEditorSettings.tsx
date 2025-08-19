import {type Component, createEffect, createSignal, For, Show} from "solid-js";
import {useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {debounce} from "@solid-primitives/scheduled";
import {TextField} from "@kobalte/core/text-field";
import {Checkbox} from "@kobalte/core/checkbox";
import {FaRegularCircle, FaRegularCircleCheck, FaRegularCircleXmark} from "solid-icons/fa";
import {useQuery} from "@tanstack/solid-query";
import {orpc} from "../../../../../../lib/orpc/client.ts";

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

// Title field component
const ScheduleTitleField: Component = () => {
  const {
    local,
    updateScheduleTitle,
    action
  } = useScheduleEditor();

  // Handler to update the schedule title
  const onChangeScheduleTitle = debounce((value: string) => {
    updateScheduleTitle(value);
  }, 200);

  return (
    <TextField
      name="title"
      class="flex flex-col flex-grow"
      value={local.title}
      onChange={onChangeScheduleTitle}
      disabled={action.updateScheduleTitle.actionInProgress}
    >
      <TextField.Label class="text-sm font-medium mb-1">Title: </TextField.Label>
      <div class="relative">
        <TextField.Input
          class="border border-gray-300 rounded-lg px-3 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Show when={action.updateScheduleTitle.actionInProgress}>
          <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
          </div>
        </Show>
      </div>
    </TextField>
  );
};

// Year field component
const ScheduleYearField: Component = () => {
  const {
    local,
    updateScheduleYear
  } = useScheduleEditor();

  // Handler to update the schedule year
  const onChangeScheduleYear = debounce((value: string) => {
    updateScheduleYear(parseInt(value));
  }, 200);

  return (
    <TextField
      name="year"
      class="flex flex-col w-1/3"
      value={local.year.toString()}
      onChange={onChangeScheduleYear}
    >
      <TextField.Label class="text-sm font-medium mb-1">Year: </TextField.Label>
      <TextField.Input
        type="number"
        class="border border-gray-300 rounded-lg px-3 py-2"
      />
    </TextField>
  );
};

// Slug field component
const ScheduleSlugField: Component = () => {
  const {
    local,
    updateScheduleSlug
  } = useScheduleEditor();

  const [slug, setSlug] = createSignal<string>('')

  const validateSlug = useQuery(
    () => orpc.private.schedules.validateSlug.queryOptions({
      input: {
        id: local.id,
        slug: slug(),
        title: local.title
      },
      enabled: () => slug() !== local.slug && slug().length > 0,
    })
  )

  createEffect(() => {
    if (local) {
      setSlug(local.slug);
    }
  })
  // Function to get error message
  const slugErrorMessage = () => {
    if (validateSlug.isError) {
      return validateSlug.error?.message;
    } else if (validateSlug.isSuccess) {
      if (!validateSlug.data.isValid) {
        return 'This slug is not available. Try one of these suggestions:';
      }
    }
    return undefined;
  };


  // Create debounced function for slug validation
  const setSlugDebounce = debounce(async (slug: string) => {
    // If slug hasn't changed, it's valid
    if (slug === local.slug) {
      return;
    }
    setSlug(slug)
  }, 500);

  const validationState = () => {
    if (validateSlug.data) {
      if (validateSlug.data.isValid) {
        return "valid"
      } else {
        return "invalid"
      }
    }
    return "valid"
  }

  return (
    <TextField
      name="slug"
      class="flex flex-col"
      value={slug()}
      onChange={setSlugDebounce}
      validationState={validationState()}
    >
      <TextField.Label class="text-sm font-medium mb-1">Slug: </TextField.Label>
      <div class="w-full flex flex-row items-center gap-4">
        <TextField.Input
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <div>
          <Show when={validateSlug.isPending}>
            <Loading/>
          </Show>
          <Show when={validateSlug.isSuccess && validateSlug.data?.isValid && slug() !== ''}>
            <Correct/>
          </Show>
          <Show when={validateSlug.isSuccess && !validateSlug.data?.isValid && slug() !== ''}>
            <Wrong/>
          </Show>
        </div>
      </div>
      <TextField.Description class="text-xs text-gray-500 mt-1">
        This will be used in the URL: /schedules/{slug()}
      </TextField.Description>
      <TextField.ErrorMessage class="text-red-500 text-sm mt-1">
        {slugErrorMessage()}
      </TextField.ErrorMessage>

      <Show when={(validateSlug.data?.suggestions.length ?? 0) > 0}>
        <div class="mt-2">
          <ul class="flex flex-wrap gap-2">
            <For each={validateSlug.data?.suggestions}>
              {(suggestion) => (
                <li>
                  <button
                    type="button"
                    class="px-2 py-1 text-sm bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                    onClick={() => {
                      updateScheduleSlug(suggestion);
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
  );
};

// Visibility checkbox component
const ScheduleVisibilityCheckbox: Component = () => {
  const {
    local,
    updateScheduleVisibility
  } = useScheduleEditor();

  // Handler to update the schedule visibility
  const onChangeScheduleVisibility = debounce((checked: boolean) => {
    updateScheduleVisibility(checked);
  }, 200);

  return (
    <Checkbox
      name="visible"
      class="items-center inline-flex cursor-pointer"
      checked={local.visible}
      onChange={onChangeScheduleVisibility}
    >
      <Checkbox.Input class="sr-only"/>
      <Checkbox.Control
        class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
        <Checkbox.Indicator>
          <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
            <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2"/>
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label class="ml-2 text-sm font-medium">Schedule Visible</Checkbox.Label>
      <Checkbox.Description class="text-xs text-gray-500 ml-2">
        When checked, this schedule will be publicly visible.
      </Checkbox.Description>
    </Checkbox>
  );
};

// Always add self to stream checkbox component
const AlwaysAddSelfToStreamCheckbox: Component = () => {
  const {
    local,
    updateAlwaysAddSelfToStream
  } = useScheduleEditor();

  // Handler to update the always add self to stream setting
  const onChangeAlwaysAddSelfToStream = debounce((checked: boolean) => {
    updateAlwaysAddSelfToStream(checked);
  }, 200);

  return (
    <Checkbox
      name="alwaysAddSelfToStream"
      class="items-center inline-flex cursor-pointer"
      checked={local.alwaysAddSelfToStream}
      onChange={onChangeAlwaysAddSelfToStream}
    >
      <Checkbox.Input class="sr-only"/>
      <Checkbox.Control
        class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
        <Checkbox.Indicator>
          <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
            <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2"/>
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label class="ml-2 text-sm font-medium">Always Add Self to Stream</Checkbox.Label>
      <Checkbox.Description class="text-xs text-gray-500 ml-2">
        When checked, you will be automatically added as a participant to new streams.
      </Checkbox.Description>
    </Checkbox>
  );
};

// Default stream visibility checkbox component
const DefaultStreamVisibilityCheckbox: Component = () => {
  const {
    local,
    updateDefaultStreamVisibility
  } = useScheduleEditor();

  // Handler to update the default stream visibility setting
  const onChangeDefaultStreamVisibility = debounce((checked: boolean) => {
    updateDefaultStreamVisibility(checked);
  }, 200);

  return (
    <Checkbox
      name="defaultStreamVisibility"
      class="items-center inline-flex cursor-pointer"
      checked={local.defaultStreamVisibility}
      onChange={onChangeDefaultStreamVisibility}
    >
      <Checkbox.Input class="sr-only"/>
      <Checkbox.Control
        class="h-5 w-5 rounded border border-gray-300 bg-white text-blue-600 focus:ring-blue-500 data-[checked]:bg-blue-600 data-[checked]:border-blue-600">
        <Checkbox.Indicator>
          <svg class="h-4 w-4 text-white" viewBox="0 0 8 8">
            <path stroke="currentColor" stroke-width="1.5" fill="none" d="M1,4 L3,6 L7,2"/>
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Label class="ml-2 text-sm font-medium">Default Stream Visibility</Checkbox.Label>
      <Checkbox.Description class="text-xs text-gray-500 ml-2">
        When checked, new streams will be visible by default.
      </Checkbox.Description>
    </Checkbox>
  );
};

// Default stream length field component
const DefaultStreamLengthField: Component = () => {
  const {
    local,
    updateDefaultStreamLength,
    action
  } = useScheduleEditor();

  // Handler to update the default stream length
  const onChangeDefaultStreamLength = debounce((value: string) => {
    updateDefaultStreamLength(parseInt(value));
  }, 200);

  // Function to adjust the default stream length
  const adjustLength = (adjustment: number) => {
    const currentLength = local.defaultStreamLength;
    const newLength = Math.max(30, currentLength + adjustment); // Ensure minimum of 30 minutes
    updateDefaultStreamLength(newLength);
  };

  return (
    <TextField
      name="defaultStreamLength"
      class="flex flex-col"
      value={local.defaultStreamLength.toString()}
      onChange={onChangeDefaultStreamLength}
      disabled={action.updateDefaultStreamLength.actionInProgress}
    >
      <TextField.Label class="text-sm font-medium mb-1">Default Stream Length (minutes): </TextField.Label>
      <div class="flex flex-row items-center gap-2">
        <div class="relative flex-1">
          <TextField.Input
            type="number"
            min={30}
            step={5}
            class="border border-gray-300 rounded-lg px-3 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Show when={action.updateDefaultStreamLength.actionInProgress}>
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
            </div>
          </Show>
        </div>
        <button
          type="button"
          disabled={local.defaultStreamLength <= 30}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease length by 30 minutes"
          onClick={() => adjustLength(-30)}
        >
          -30m
        </button>
        <button
          type="button"
          disabled={local.defaultStreamLength <= 15}
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease length by 15 minutes"
          onClick={() => adjustLength(-15)}
        >
          -15m
        </button>
        <button
          type="button"
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs"
          title="Increase length by 15 minutes"
          onClick={() => adjustLength(15)}
        >
          +15m
        </button>
        <button
          type="button"
          class="bg-accent hover:bg-accent-600 text-white px-3 py-2 rounded-lg transition-all text-xxs"
          title="Increase length by 30 minutes"
          onClick={() => adjustLength(30)}
        >
          +30m
        </button>
      </div>
      <TextField.Description class="text-xs text-gray-500 mt-1">
        The default length in minutes for newly created streams.
      </TextField.Description>
    </TextField>
  );
};

export const ScheduleEditorSettings: Component = () => {
  const {
    action
  } = useScheduleEditor();

  return (
    <div>
      <h2 class="text-xl font-bold mb-4">Schedule Settings</h2>

      <Show when={action.updateScheduleTitle.lastErrorMessage ||
        action.updateScheduleYear.lastErrorMessage ||
        action.updateScheduleSlug.lastErrorMessage ||
        action.updateScheduleVisibility.lastErrorMessage ||
        action.updateAlwaysAddSelfToStream.lastErrorMessage ||
        action.updateDefaultStreamVisibility.lastErrorMessage ||
        action.updateDefaultStreamLength.lastErrorMessage}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {action.updateScheduleTitle.lastErrorMessage ||
            action.updateScheduleYear.lastErrorMessage ||
            action.updateScheduleSlug.lastErrorMessage ||
            action.updateScheduleVisibility.lastErrorMessage ||
            action.updateAlwaysAddSelfToStream.lastErrorMessage ||
            action.updateDefaultStreamVisibility.lastErrorMessage ||
            action.updateDefaultStreamLength.lastErrorMessage}
        </div>
      </Show>

      <div class="grid grid-cols-1 gap-4">
        <div class="flex gap-4">
          <ScheduleTitleField/>
          <ScheduleYearField/>
        </div>
        <ScheduleSlugField/>
        <ScheduleVisibilityCheckbox/>

        <h3 class="text-lg font-semibold mt-4 mb-2">Stream Settings</h3>
        <AlwaysAddSelfToStreamCheckbox/>
        <DefaultStreamVisibilityCheckbox/>
        <DefaultStreamLengthField/>
      </div>
    </div>
  );
}
