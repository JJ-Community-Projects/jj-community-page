import {type Component, Match, Show, Switch} from "solid-js";
import {YogsScheduleComponent} from "./schedule/YogsScheduleComponent.tsx";
import {useYogsScheduleFirestore} from "../../lib/useYogsScheduleFirestore.ts";
import type {FullCreator, FullSchedule} from "../../lib/model/ContentTypes.ts";
import {PlaceholderSchedule} from "../schedulePlaceholder/PlaceholderSchedule.tsx";
import {useConfig} from "../../lib/useConfig.ts";
import {Countdown} from "../Countdown.tsx";
import {MobileYogsScheduleComponent} from "./schedule/mobile/MobileYogsScheduleComponent.tsx";
import {
  DiscordIcon,
  GlobeIcon,
  InstagramIcon,
  TiktokIcon,
  TwitchIcon,
  TwitterIcon,
  YoutubeIcon
} from "../common/JJIcons.tsx";


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
          <div class="desktop-schedule w-full flex flex-col items-center justify-center">
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
            <Disclaimer/>
          </div>
          <div class="mobile-schedule w-full flex flex-col items-center justify-center">
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
            <Disclaimer/>
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


const Disclaimer: Component = () => {
  return (
    <div class={'max-w-[30rem] text-white text-center text-pretty'}>
      <p>
        This site <strong>is maintained by the community</strong>.
      </p>
      <p>
        If you find errors or see that a stream is missing use the contact info below or message @ostof on
        discord.
      </p>
      <p>
        The schedule is subject to change. Not all participants are confirmed and some streams might be moved or cancelled.
      </p>
      <p>
        For more information visit the Yogscast's social media.
      </p>
      <ExternalLinks/>
      <p>
        This site is a <strong>fan Project and not associated with the Jingle Jam, the Yogscast or their
        partners.</strong>
      </p>
    </div>
  )
}


const ExternalLinks = () => {
  return (
    <div class={'w-full flex flex-row gap-4 items-center justify-center p-2'}>
      <a
        class={'hover:scale-110 transition-all'}
        href={'https://www.youtube.com/yogscast'}
        target={'_blank'}
        aria-label={'Yogscast Youtube channel'}>
        <YoutubeIcon class={'~w-2/4 ~h-2/4'}/>
      </a><a
        class={'hover:scale-110 transition-all'}
        href={'https://twitch.tv/yogscast'}
        target={'_blank'}
        aria-label={'Yogscast Twitch channel'}>
        <TwitchIcon class={'~w-2/4 ~h-2/4'}/>
      </a>
      <a
        class={'hover:scale-110 transition-all'}
        target={'_blank'}
        href={'https://x.com/yogscast'}
        aria-label={'Yogscast Twitter'}>
        <TwitterIcon class={'~w-2/4 ~h-2/4'}/>
      </a>
      <a
        class={'hover:scale-110 transition-all'}
        target={'_blank'}
        href={'https://www.instagram.com/officialyogscast/'}
        aria-label={'Yogscast Instagram'}>
        <InstagramIcon class={'~w-2/4 ~h-2/4'}/>
      </a>
      <a
        class={'hover:scale-110 transition-all'}
        target={'_blank'}
        href={'https://www.tiktok.com/@yogscastofficial'}
        aria-label={'Jingle Jam Tiktok'}>
        <TiktokIcon class={'~w-2/4 ~h-2/4'}/>
      </a>
    </div>

  )
}
