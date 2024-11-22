import {type Component, Match, Show, Switch} from "solid-js";
import {YogsScheduleComponent} from "./schedule/YogsScheduleComponent.tsx";
import {useYogsScheduleFirestore} from "../../lib/useYogsScheduleFirestore.ts";
import type {FullCreator, FullSchedule} from "../../lib/model/ContentTypes.ts";
import {PlaceholderSchedule} from "../schedulePlaceholder/PlaceholderSchedule.tsx";
import {useConfig} from "../../lib/useConfig.ts";
import {Disclaimer} from "../Disclaimer.tsx";
import {Countdown} from "../Countdown.tsx";
import {MobileYogsScheduleComponent} from "./schedule/mobile/MobileYogsScheduleComponent.tsx";
import {DateTime} from "luxon";


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
              <Disclaimer/>
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

  return (
    <Switch>
      <Match when={schedule() !== undefined}>
        <>
          <div class="desktop-schedule w-full">
            <YogsScheduleComponent
              schedule={schedule()!}
              creators={props.creators}
            >
            </YogsScheduleComponent>
            <p class={'text-center text-white pb-4'}>Last Updated {schedule()?.updatedAt.toLocaleString({
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            })}</p>
          </div>
          <div class="mobile-schedule w-full">
            <MobileYogsScheduleComponent
              schedule={schedule()!}
              creators={props.creators}
            >
            </MobileYogsScheduleComponent>
            <p class={'text-center text-white pb-4'}>Last Updated {schedule()?.updatedAt.toLocaleString({
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            })}</p>
          </div>
        </>
      </Match>
      <Match when={schedule() === undefined}>
        <div class={'loading-container'}>
          <PlaceholderSchedule schedule={props.fallbackSchedule}/>
        </div>
      </Match>
    </Switch>
  );
}
