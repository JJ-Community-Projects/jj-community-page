import { type Component, For, Show } from 'solid-js'
import { useCommunityPage } from './CommunityPageProvider.tsx'
import { CommunityUserItem } from './CommunityUserItem.tsx'
import { twMerge } from 'tailwind-merge'

export const CommunityUsers: Component = (props) => {
  const { users, selectedTagIds, clearSelectedTags, usersFiltered } = useCommunityPage()
  const anyTagsSelected = () => selectedTagIds().length > 0
  const list = () => (anyTagsSelected() ? usersFiltered() : users.data ? users.data : [])
  return (
    <>
      <Show when={users.isLoading}>
        <p class={'text-white/80'}>Loading users…</p>
      </Show>
      <Show when={users.isError}>
        <p class={'text-red-400'}>Failed to load users.</p>
      </Show>
      <Show when={users.isSuccess && list().length > 0}>
        <div class={'mx-auto flex w-full flex-col gap-4'}>
          <div
            class={twMerge(
              'mb-2 mt-6 flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-2',
            )}
          >
            <div class={'flex flex-col'}>
              <h2 class={twMerge('text-lg font-semibold text-white')}>
                Users
              </h2>
              <p class={twMerge('text-white')}>
                Fundraisers that have an account
              </p>
            </div>
          </div>

          <div
            class={
              'grid w-full grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] content-center gap-2'
            }
          >
            <For each={list()}>
              {(user) => <CommunityUserItem user={user} />}
            </For>
          </div>
        </div>
      </Show>
      <Show when={users.isSuccess && list().length === 0}>
        <div class={'flex flex-col items-center gap-2 text-white/90'}>
          <p>
            {anyTagsSelected()
              ? 'No users match the selected tags.'
              : 'No users found.'}
          </p>
          <Show when={anyTagsSelected()}>
            <button
              class={'rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20'}
              onClick={() => clearSelectedTags()}
            >
              Clear selected tags
            </button>
          </Show>
        </div>
      </Show>
    </>
  )
}
