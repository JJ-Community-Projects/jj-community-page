import {type Component, createSignal, Show, createResource} from "solid-js";
import {debounce} from "@solid-primitives/scheduled";
import {ScheduleEditorProvider, useScheduleEditor} from "../../providers/ScheduleEditorProvider.tsx";
import {actions} from "astro:actions";
import {createMediaQuery} from "@solid-primitives/media";
import {TextField} from "@kobalte/core/text-field";
import {ScheduleEditorHeader} from "./ScheduleEditorHeader.tsx";
import {ScheduleEditorSettings} from "./ScheduleEditorSettings.tsx";
import {DesktopStreamsList, MobileStreamsList} from "./ScheduleEditorStreamList.tsx";

interface ScheduleEditorComponentProps {
  scheduleId: number;
  userId: number;
  username: string;
}

export const ScheduleEditorComponent: Component<ScheduleEditorComponentProps> = (props) => {

  const isDesktop = createMediaQuery("(min-width: 768px)");

  return (
    <ScheduleEditorProvider id={props.scheduleId} userId={props.userId} username={props.username}>

      <div class="max-w-6xl mx-auto px-4 py-8">
        <ScheduleEditorHeader/>

        <ScheduleEditorSettings/>

        <Show when={isDesktop()} fallback={<MobileStreamsList/>}>
          <DesktopStreamsList/>
        </Show>

        <DEBUG/>
      </div>
    </ScheduleEditorProvider>
  );
}

interface ScheduleEditorSlugProps {
}

export const ScheduleEditorSlug: Component<ScheduleEditorSlugProps> = (props) => {
  const {
    local,
    updateScheduleSlug,
  } = useScheduleEditor();

  const [slug, setSlug] = createSignal<string>(local.slug)

  const [isSlugValid, setIsSlugValid] = createSignal<boolean>(true)

  // Handler to update the schedule slug
  const checkSlugValidity = debounce(async (slug: string) => {
    const valid = await actions.schedules.isSlugValid({
      id: local.id,
      slug: slug,
    })
    if (valid.error) {
      console.log(valid.error)
      return;
    }
    setIsSlugValid(valid.data.isValid)
  }, 1000)

  return (
    <TextField
      class="flex flex-col"
      value={slug()}
      onChange={(slug) => {
        setSlug(slug)
        checkSlugValidity(slug)
      }}
      validationState={isSlugValid() ? 'valid' : 'invalid'}
    >
      <TextField.Label class="text-sm font-medium mb-1">Slug: </TextField.Label>
      <TextField.Input
        type="text"
        class="border border-gray-300 rounded-lg px-3 py-2"
      />
      <TextField.Description class="text-xs text-gray-500 mt-1">This will be used in the URL:
        /schedules/{local.slug}</TextField.Description>
      <TextField.ErrorMessage class="text-sm text-gray-500 mt-1">
        Slug is already taken. Try again.
      </TextField.ErrorMessage>
    </TextField>
  );
}


const DEBUG = () => {
  const {id, local} = useScheduleEditor();

  const [data, {refetch}] = createResource(() => {
    return actions.schedules.getTables(local.id)
  })

  return (
    <>
      <pre class={'text-white'}>{JSON.stringify(local, null, 2)}</pre>
      <button onClick={refetch}>Refresh</button>
      <Show when={data.state=='ready' && data()}>
        <pre class={'text-white'}>{JSON.stringify(data(), null, 2)}</pre>
      </Show>
    </>
  )
}
