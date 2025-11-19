import { type Component, For, Show } from 'solid-js'
import { twMerge } from 'tailwind-merge'
import { JJIcon, TwitchIcon } from '../../common/icons/JJIcons.tsx'
import type { UserWithInfo } from '../../../lib/orpc/private/jjData/contract.ts'
import { FaSolidCalendarWeek } from 'solid-icons/fa'

interface CommunityUserItemProps {
  user: UserWithInfo
}

export const CommunityUserItem: Component<CommunityUserItemProps> = (props) => {
  const user = () => props.user

  const profileUrl = () => `/${user().tiltifySlug}`
  const twitchUrl = () =>
    user().twitchLogin
      ? `https://www.twitch.tv/${user().twitchLogin}`
      : undefined
  const scheduleUrl = () => user().scheduleUrl

  return (
    <div
      class={twMerge(
        'w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        'hover:scale-101 hover:brightness-105',
        'bg-gradient-to-b from-neutral-50 to-neutral-100 ring-1 ring-black/5',
      )}
    >
      <div class={'flex h-full w-full flex-col gap-2 p-2'}>
        <div class={'flex items-start gap-2'}>
          <img
            class={'size-8 rounded-lg ring-1 ring-black/10'}
            alt={user().username}
            src={user().profileImage}
            loading={'lazy'}
          />
          <div class={'min-w-0 flex-1'}>
            <p class={'truncate text-ellipsis text-sm font-semibold'}>
              {user().username}
            </p>
          </div>
        </div>
        <div class={'mt-1 flex flex-wrap gap-1'}>
          <For each={user().tags.slice(0,3)}>
            {(tag) => (
              <span
                class={
                  'inline-flex items-center px-1.5 py-0.5 text-[8px] font-medium rounded-full'
                }
                style={{
                  border: `1px solid ${tag.color}`,
                  color: tag.color,
                  background: 'white',
                }}
                title={tag.slug}
              >
                    {tag.name}
                  </span>
            )}
          </For>
        </div>
        <div class={'flex-1'} />
        <div class={'flex gap-1'}>
          <a
            href={profileUrl()}
            class={twMerge(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-1',
              'bg-primary-500 text-white',
              'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
            )}
          >
            <span class={'text-xxs'}>Profile</span>
            <JJIcon class={'size-2'} />
          </a>
          <Show when={twitchUrl()}>
            {
              twitchUrl => {
                return (
                  <a
                    target={'_blank'}
                    href={twitchUrl()}
                    class={twMerge(
                      'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1',
                      'bg-twitch-500 text-white',
                      'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
                    )}
                    rel={'noreferrer noopener'}
                  >
                    <span class={'text-xxs'}>Twitch</span>
                    <TwitchIcon class={'size-2'} />
                  </a>
                )
              }
            }
          </Show>
          <Show when={scheduleUrl()}>
            {
              url => {
                return (
                  <a
                    href={url()}
                    class={twMerge(
                      'inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1',
                      'bg-accent-500 text-white',
                      'transition-all duration-200 hover:ring-2 hover:ring-black/5 hover:brightness-105',
                    )}
                  >
                    <span class={'text-xxs'}>Schedule</span>
                    <FaSolidCalendarWeek class={'size-2'} />
                  </a>
                )
              }
            }
          </Show>
        </div>
      </div>
    </div>
  )
}
