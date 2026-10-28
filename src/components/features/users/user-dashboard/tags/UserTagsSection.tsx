import { type Component } from 'solid-js'
import { TagSearchInput } from './TagSearchInput.tsx'
import { AvailableTagsList } from './AvailableTagsList.tsx'
import { UserTagsList } from './UserTagsList.tsx'
import { CategoryTagsList } from './CategoryTagsList.tsx'

export const UserTagsSection: Component = () => {
  return (
    <div class="rounded-tile bg-linear-to-b from-surface to-surface-2 text-fg shadow-tile ring-1 ring-line overflow-visible">
      <div class="space-y-6 fl-p-4/8">
        <div class="relative space-y-4 px-6 pb-6 leading-relaxed text-fg-muted fl-text-sm/base">
          <div class="rounded-xl border border-accent/20 bg-linear-to-br from-white to-accent/5 p-5 shadow-xs ring-1 ring-black/5">
            <ul class="list-disc space-y-1 pl-6 marker:text-accent-600">
              <li>
                Choose from available tags to show off your self and your
                streams.
              </li>
              <li>
                Tags can help others to discover streamers with similar
                interests and causes.
              </li>
              <li>
                People with similar tags as you will be shown on your profile
                page in the <strong>Related</strong> section.
              </li>
              <li>Blocked users will not be shown on your profile page.</li>
              <li>
                I recommend to add a tag for the cause you are fundraising for.
              </li>
              <li>You can have a maximum of 10 tags.</li>
            </ul>

            <div class="mt-4 flex items-start gap-3 rounded-lg border-l-4 border-accent/30 bg-linear-to-r from-accent/10 to-accent/5 p-4">
              <p class="font-medium text-accent-700">
                <span>
                  <strong>You can not find the right tags?</strong> Message
                  Ostof on Discord to suggest a tag.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced user tags list */}
        <UserTagsList />

        {/* Category selection and tags list (merged component) */}
        <CategoryTagsList />

        {/* Enhanced available tags list */}
        <AvailableTagsList />

        {/* Enhanced search input */}
        <TagSearchInput />
      </div>
    </div>
  )
}
