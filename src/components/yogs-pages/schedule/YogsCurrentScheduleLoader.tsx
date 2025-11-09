import { type Component, Match, Show, Switch } from 'solid-js'
import { YogsScheduleComponent } from './YogsScheduleComponent.tsx'
import type {
  YogsCreator,
  YogsSchedule,
} from '../../../lib/orpc/private/yogs/contract.ts'
import { PlaceholderSchedule } from './placeholder/PlaceholderSchedule.tsx'
import { Countdown } from '../../common/ui/Countdown.tsx'
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

interface ConfigLoaderProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
}

const ConfigLoader: Component<ConfigLoaderProps> = (props) => {
  const config = useQuery(() =>
    orpcPrivate.yogs.config.queryOptions({
      staleTime: 60_000 * 5,
      refetchInterval: 60_000 * 10,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
    }),
  )
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
          <div
            class={
              'flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white text-white/90 sm:p-4'
            }
          >
            <MainCountdownSimple />
            <MainJJStartTimes />
            <p>
              The <span class={'font-bold'}>Yogscast Jingle Jam Schedule</span>{' '}
              will be shown once it was announced on Social Media.
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

            <PlaceholderSchedule schedule={props.fallbackSchedule} />
          </div>
        </Show>
      </Match>
    </Switch>
  )
}

interface CurrentScheduleLoaderProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
}

export const YogsCurrentScheduleLoader: Component<
  CurrentScheduleLoaderProps
> = (props) => {
  return (
    <div class={'min-h-20'}>
      <QueryClientProvider client={new QueryClient()}>
        <ConfigLoader
          creators={props.creators}
          fallbackSchedule={props.fallbackSchedule}
        />
      </QueryClientProvider>
    </div>
  )
}

interface BodyProps {
  creators: YogsCreator[]
  fallbackSchedule: YogsSchedule
}

const Body: Component<BodyProps> = (props) => {
  const schedule = useQuery(() =>
    orpcPrivate.yogs.schedule.queryOptions({
      staleTime: 60_000 * 5,
      refetchInterval: 60_000 * 10,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
    }),
  )

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
