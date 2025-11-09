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
            <p>The <span class={'font-bold'}>Yogscast Jingle Jam Schedule</span> will be shown once it was announced on Social Media.</p>
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
            <p class={'pb-4 text-center text-white'}>
              Last Updated TODO
              {/**schedule.data!.updatedAt.toLocaleString({
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZoneName: 'short',
              })**/}
            </p>
          </div>
          <div class="mobile-schedule flex w-full flex-col items-center justify-center">
            <MobileYogsScheduleComponent
              schedule={schedule.data!}
              creators={props.creators}
            ></MobileYogsScheduleComponent>
            <p class={'pb-4 text-center text-white'}>
              Last Updated TODO
              {/**schedule.data!.updatedAt.toLocaleString({
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZoneName: 'short',
              })**/}
            </p>
            <YogsScheduleDisclaimer />
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
