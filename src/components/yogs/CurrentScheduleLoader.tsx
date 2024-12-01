import {type Component, createEffect, Match, Show, Switch} from "solid-js";
import {YogsScheduleComponent} from "./schedule/YogsScheduleComponent.tsx";
import {useYogsScheduleFirestore} from "../../lib/useYogsScheduleFirestore.ts";
import type {FullCreator, FullSchedule} from "../../lib/model/ContentTypes.ts";
import {PlaceholderSchedule} from "../schedulePlaceholder/PlaceholderSchedule.tsx";
import {useConfig} from "../../lib/useConfig.ts";
import {Countdown} from "../Countdown.tsx";
import {MobileYogsScheduleComponent} from "./schedule/mobile/MobileYogsScheduleComponent.tsx";
import {ScheduleDisclaimer} from "./ScheduleDisclaimer.tsx";


interface CurrentScheduleLoaderProps {
  creators: FullCreator[]
  fallbackSchedule: FullSchedule
}

export const CurrentScheduleLoader: Component<CurrentScheduleLoaderProps> = (props) => {
  const config = useConfig();
  return (
    <div class={'min-h-20'}>
      <Switch>
        <Match when={config.data}>
          <Show when={config.data?.showSchedule}>
            <Body fallbackSchedule={props.fallbackSchedule} creators={props.creators}/>
          </Show>
          <Show when={!config.data?.showSchedule}>
            <div>
              <Countdown/>
              <ScheduleDisclaimer/>
            </div>
          </Show>
        </Match>
      </Switch>
    </div>
  );
}


interface BodyProps {
  creators: FullCreator[]
  fallbackSchedule: FullSchedule
}

const Body: Component<BodyProps> = (props) => {
  const schedule = useYogsScheduleFirestore(props.creators);
  createEffect(() => {
    console.log('Schedule updated', schedule)
  })
  return (
    <Switch>
      <Match when={schedule.data}>
        <>
          <div class="desktop-schedule w-full flex flex-col items-center justify-center">
            <YogsScheduleComponent
              schedule={schedule.data!}
              creators={props.creators}
            >
            </YogsScheduleComponent>
            <p class={'text-center text-white pb-4'}>Last Updated {schedule.data!.updatedAt.toLocaleString({
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            })}</p>
            <ScheduleDisclaimer/>
          </div>
          <div class="mobile-schedule w-full flex flex-col items-center justify-center">
            <MobileYogsScheduleComponent
              schedule={schedule.data!}
              creators={props.creators}
            >
            </MobileYogsScheduleComponent>
            <p class={'text-center text-white pb-4'}>Last Updated {schedule.data!.updatedAt.toLocaleString({
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            })}</p>
            <ScheduleDisclaimer/>
          </div>
        </>
      </Match>
      <Match when={schedule.loading}>
        <div class={'loading-container'}>
          <PlaceholderSchedule schedule={props.fallbackSchedule}/>
        </div>
      </Match>
      <Match when={schedule.error}>
        <p>{schedule.error?.message}</p>
      </Match>
    </Switch>
  );
}
