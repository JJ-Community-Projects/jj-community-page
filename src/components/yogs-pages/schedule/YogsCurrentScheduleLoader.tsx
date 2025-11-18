import {
  type Component,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
} from 'solid-js'
import { YogsScheduleComponent } from './YogsScheduleComponent.tsx'
import type {
  YogsConfig,
  YogsCreator,
  YogsSchedule,
} from '../../../lib/orpc/private/yogs/contract.ts'
import { PlaceholderSchedule } from './placeholder/PlaceholderSchedule.tsx'
import { MobileYogsScheduleComponent } from './mobile/MobileYogsScheduleComponent.tsx'
import { YogsScheduleDisclaimer } from './YogsScheduleDisclaimer.tsx'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import { orpcPrivate } from '../../../lib/orpc/client.ts'
import { QueryClient } from '@tanstack/query-core'
import {
  MainCountdownSimple,
  MainJJStartTimes,
} from '../../common/ui/MainHeader.tsx'
import {
  YoutubeIcon,
  TwitchIcon,
  BskyIcon,
  TwitterIcon,
  InstagramIcon,
  TiktokIcon,
} from '../../common/icons/JJIcons.tsx'
import { DateTime } from 'luxon'
import { YogsCreatorPill } from '../creators/YogsCreatorPill.tsx'

interface ConfigLoaderProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
  config: YogsConfig
}

const ConfigLoader: Component<ConfigLoaderProps> = (props) => {
  const [enabled, setEnabled] = createSignal<boolean>(false)

  const config = useQuery(() =>
    orpcPrivate.yogs.config.queryOptions({
      staleTime: 60_000 * 5,
      refetchInterval: 60_000 * 10,
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      enabled: enabled(),
      placeholderData: (prev) => prev ?? props.config,
      experimental_prefetchInRender: true,
    }),
  )

  onMount(() => {
    setEnabled(true)
  })

  return (
    <Switch>
      <Match when={config.data}>
        <Show when={config.data?.showSchedule}>
          <Body
            fallbackSchedule={props.fallbackSchedule}
            creators={props.creators}
          />
        </Show>
        <Show when={!config.data?.showSchedule}>
          <Countdown />
        </Show>
      </Match>
    </Switch>
  )
}

interface CurrentScheduleLoaderProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
  config: YogsConfig
}

export const YogsCurrentScheduleLoader: Component<
  CurrentScheduleLoaderProps
> = (props) => {
  onMount(() => {
    console.log('YogsCurrentScheduleLoader onMount')
  })

  return (
    <Suspense>
      <div class={'min-h-20'}>
        <QueryClientProvider client={new QueryClient()}>
          <ConfigLoader
            creators={props.creators}
            fallbackSchedule={props.fallbackSchedule}
            config={props.config}
          />
        </QueryClientProvider>
      </div>
    </Suspense>
  )
}

interface BodyProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
}

const Body: Component<BodyProps> = (props) => {
  const [enabled, setEnabled] = createSignal<boolean>(false)

  const schedule = useQuery(() =>
    orpcPrivate.yogs.schedule.queryOptions({
      staleTime: 60_000 * 5,
      refetchInterval: 60_000 * 10,
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      enabled: enabled(),
      placeholderData: (prev) => prev ?? props.fallbackSchedule,
      experimental_prefetchInRender: true,
    }),
  )

  onMount(() => {
    setEnabled(true)
  })

  return (
    <Switch>
      <Match when={schedule.data}>
        <>
          <div class="desktop-schedule flex w-full flex-col items-center justify-center">
            <YogsScheduleComponent
              schedule={schedule.data!}
              creators={props.creators}
            ></YogsScheduleComponent>
            <Show when={schedule.data?.updatedAt}>
              {(updatedAt) => {
                return (
                  <p class={'pb-4 text-center text-white'}>
                    Last Updated{' '}
                    {DateTime.fromJSDate(updatedAt()).toLocaleString({
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      timeZoneName: 'short',
                    })}
                  </p>
                )
              }}
            </Show>
          </div>
          <div class="mobile-schedule flex w-full flex-col items-center justify-center">
            <MobileYogsScheduleComponent
              schedule={schedule.data!}
              creators={props.creators}
            ></MobileYogsScheduleComponent>
            <Show when={schedule.data?.updatedAt}>
              {(updatedAt) => {
                return (
                  <p class={'pb-4 text-center text-white'}>
                    Last Updated{' '}
                    {DateTime.fromJSDate(updatedAt()).toLocaleString({
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      timeZoneName: 'short',
                    })}
                  </p>
                )
              }}
            </Show>
            <YogsScheduleDisclaimer />
          </div>
          <div
            class={
              'flex flex-col items-center justify-center gap-1 text-pretty text-center text-white'
            }
          >
            <p>
              The schedule is subject to change and not all participants are
              confirmed. For more information visit the Yogscast's social media.
            </p>

            <div
              class={
                'flex w-full flex-row items-center justify-center gap-4 p-2'
              }
            >
              <a
                class={'transition-all hover:scale-110'}
                href={'https://www.youtube.com/yogscast'}
                target={'_blank'}
                aria-label={'Yogscast Youtube channel'}
              >
                <YoutubeIcon class={'size-4'} />
              </a>
              <a
                class={'transition-all hover:scale-110'}
                href={'https://twitch.tv/yogscast'}
                target={'_blank'}
                aria-label={'Yogscast Twitch channel'}
              >
                <TwitchIcon class={'size-4'} />
              </a>
              <a
                class={'transition-all hover:scale-110'}
                target={'_blank'}
                href={'https://bsky.app/profile/yogscast.com'}
                aria-label={'Yogscast Blue sky'}
              >
                <BskyIcon class={'size-4'} />
              </a>
              <a
                class={'transition-all hover:scale-110'}
                target={'_blank'}
                href={'https://x.com/yogscast'}
                aria-label={'Yogscast Twitter'}
              >
                <TwitterIcon class={'size-4'} />
              </a>
              <a
                class={'transition-all hover:scale-110'}
                target={'_blank'}
                href={'https://www.instagram.com/officialyogscast/'}
                aria-label={'Yogscast Instagram'}
              >
                <InstagramIcon class={'size-4'} />
              </a>
              <a
                class={'transition-all hover:scale-110'}
                target={'_blank'}
                href={'https://www.tiktok.com/@yogscastofficial'}
                aria-label={'Jingle Jam Tiktok'}
              >
                <TiktokIcon class={'size-4'} />
              </a>
            </div>

            <p>
              This Yogscast Jingle Jam schedule is maintained by the community.
              If you find errors or see that a stream is missing use the contact
              info below. Streams that appear here are not guaranteed to happen
              or might be delayed. For more information visit the Jingle Jam
              Twitter page. This schedule is a fan Project and not associated
              with the Jingle Jam, the Yogscast or their partners.
            </p>
          </div>
          <Creators creators={props.creators} />
        </>
      </Match>
      <Match when={schedule.isPending}>
        <div class={'loading-container'}>
          <PlaceholderSchedule schedule={props.fallbackSchedule} />
        </div>
      </Match>
      <Match when={schedule.error}>
        <p>{schedule.error?.message}</p>
      </Match>
    </Switch>
  )
}

const Creators: Component<{
  creators: YogsCreator[]
}> = (props) => {
  const yogs = props.creators.filter(
    (creator) => creator.type === 'yogs' || creator.type === 'staff',
  )
  const bestOf = props.creators.filter((creator) => creator.type === 'best_of')
  const friends = props.creators.filter((creator) => creator.type === 'friend')

  return (
    <Show when={props.creators.length > 0}>
      <div class="flex flex-col items-center justify-center gap-2 p-4">
        <p class="text-center text-2xl text-white">Yogs & Friends</p>
        <Show when={yogs.length > 0}>
          <p class="mb-1 text-xl text-white">Yogs</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <For each={yogs}>
              {(creator) => <YogsCreatorPill creator={creator} />}
            </For>
          </div>
        </Show>
        <Show when={bestOf.length > 0}>
          <p class="mb-1 text-xl text-white">Best of</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <For each={bestOf}>
              {(creator) => <YogsCreatorPill creator={creator} />}
            </For>
          </div>
        </Show>
        <Show when={friends.length > 0}>
          <p class="mb-1 text-xl text-white">Friends</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <For each={friends}>
              {(creator) => <YogsCreatorPill creator={creator} />}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  )
}

const Countdown: Component = () => {
  return (
    <div
      class={
        'flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/90 sm:p-4'
      }
    >
      <h1 class={'text-center ~text-2xl/4xl'}>
        Yogscast Jingle Jam Schedule 2025
      </h1>
      <h2 class="text-center ~text-lg/xl">
        The Yogscast Jingle Jam in your timezone with Links to participants,
        vods and more.
      </h2>
      <MainCountdownSimple />
      <MainJJStartTimes />
      <p>
        The <span class={'font-bold'}>Yogscast Jingle Jam Schedule</span> will
        be shown once it was announced on Social Media.
      </p>
      <div class={'flex w-full flex-row items-center justify-center gap-4 p-2'}>
        <a
          class={'transition-all hover:scale-110'}
          href={'https://www.youtube.com/yogscast'}
          target={'_blank'}
          aria-label={'Yogscast Youtube channel'}
        >
          <YoutubeIcon class={'size-4'} />
        </a>
        <a
          class={'transition-all hover:scale-110'}
          href={'https://twitch.tv/yogscast'}
          target={'_blank'}
          aria-label={'Yogscast Twitch channel'}
        >
          <TwitchIcon class={'size-4'} />
        </a>
        <a
          class={'transition-all hover:scale-110'}
          target={'_blank'}
          href={'https://bsky.app/profile/yogscast.com'}
          aria-label={'Yogscast Blue sky'}
        >
          <BskyIcon class={'size-4'} />
        </a>
        <a
          class={'transition-all hover:scale-110'}
          target={'_blank'}
          href={'https://x.com/yogscast'}
          aria-label={'Yogscast Twitter'}
        >
          <TwitterIcon class={'size-4'} />
        </a>
        <a
          class={'transition-all hover:scale-110'}
          target={'_blank'}
          href={'https://www.instagram.com/officialyogscast/'}
          aria-label={'Yogscast Instagram'}
        >
          <InstagramIcon class={'size-4'} />
        </a>
        <a
          class={'transition-all hover:scale-110'}
          target={'_blank'}
          href={'https://www.tiktok.com/@yogscastofficial'}
          aria-label={'Jingle Jam Tiktok'}
        >
          <TiktokIcon class={'size-4'} />
        </a>
      </div>
    </div>
  )
}
