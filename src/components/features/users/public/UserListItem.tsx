import { type Component, Show } from 'solid-js'
import type { UserDisplayWithTags } from '../../../../lib/orpc/public/schemas/users.ts'

interface UserListItemProps {
  user: UserDisplayWithTags;
}

const UserListItem: Component<UserListItemProps> = (props) => {
  const { user } = props;

  return (
    <a href={`/${user.tiltifySlug}`} class="bg-white rounded-lg p-4 transition-all flex items-center gap-4 hover:shadow-md hover:scale-[1.02]">
      <img
        src={user.profileImage}
        alt={`${user.userId}'s avatar`}
        class="w-16 h-16 rounded-full object-cover"
        width="64"
        height="64"
      />
      <div>
        <h2 class="text-xl font-semibold">{user.username}</h2>
        <Show when={false}>
          <span class="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">Live</span>
        </Show>
        <Show when={user.tags.length > 0}>
          <div class="flex flex-wrap gap-1 mt-1">
            {user.tags.map(tag => (
              <span class="text-xs bg-white px-2 py-0.5 rounded">{tag.name}</span>
            ))}
          </div>
        </Show>
      </div>
    </a>
  );
};

export default UserListItem;
