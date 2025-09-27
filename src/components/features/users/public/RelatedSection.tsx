import { type Component, For, Show } from 'solid-js'
import type { UserDisplay } from '../../../../lib/orpc/public/schemas/UserDisplaySchema'
import { UserPillAvatar } from '../../../common/UserAvatar.tsx'
import { FaSolidUserTag } from 'solid-icons/fa'

interface RelatedSectionProps {
  related: UserDisplay[]
  userColors: {
    primaryColor: string | null
    accentColor: string | null
  }
}

export const RelatedSection: Component<RelatedSectionProps> = (props) => {
  // Get user colors with fallbacks to design system colors
  const primaryColor = props.userColors.primaryColor || '#E30E50'
  const accentColor = props.userColors.accentColor || '#3584BF'

  return (
    <div
      class="group w-full rounded-xl border-2 bg-white shadow-md transition-all duration-300 group-hover:border-accent-200 hover:shadow-lg"
      style={{
        '--user-primary': primaryColor,
        '--user-accent': accentColor,
      }}
    >
      <div class="p-4">
        <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaSolidUserTag class="h-5 w-5 text-black transition-all duration-300 group-hover:text-accent" />
          <h2 class="font-babas text-black transition-all duration-300 ~text-xl/2xl group-hover:text-accent">
            Related
          </h2>
        </div>
        <Show when={props.related && props.related.length > 0}>
          <div class="flex flex-wrap gap-4">
            <For each={props.related}>
              {(related) => (
                <div class="min-w-24">
                  <UserPillAvatar
                    user={related}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                  />
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}
