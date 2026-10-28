import { type Component } from 'solid-js'
import { TagSearchInput } from './TagSearchInput.tsx'
import { AvailableTagsList } from './AvailableTagsList.tsx'
import { UserTagsList } from './UserTagsList.tsx'
import { CategoryTagsList } from './CategoryTagsList.tsx'
import { Alert } from '../../../../ui/Status'

export const UserTagsSection: Component = () => {
  return (
    <div class="flex flex-col gap-3">
      <Alert tone="info" title="About tags">
        <ul class="list-disc space-y-0.5 pl-4">
          <li>
            Choose from available tags to show off yourself and your streams.
          </li>
          <li>
            Tags help others discover streamers with similar interests and
            causes.
          </li>
          <li>
            People with tags like yours are shown on your profile page in the{' '}
            <strong>Related</strong> section. Blocked users are not.
          </li>
          <li>Add a tag for the cause you are fundraising for.</li>
          <li>You can have up to 10 tags.</li>
          <li>
            <strong>Can't find the right tag?</strong> Message Ostof on Discord
            to suggest one.
          </li>
        </ul>
      </Alert>
      <TagSearchInput />
      <UserTagsList />
      <CategoryTagsList />
      <AvailableTagsList />
    </div>
  )
}
