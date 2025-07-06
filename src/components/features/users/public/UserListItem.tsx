import { type Component, Show } from "solid-js";
import type { UserPageUI } from "../../../../lib/db/models/user-ui";

interface UserListItemProps {
  user: UserPageUI;
}

const UserListItem: Component<UserListItemProps> = (props) => {
  const { user } = props;

  return (
    <a href={`/${user.slug}`} class="bg-white rounded-lg p-4 transition-all flex items-center gap-4 hover:shadow-md hover:scale-[1.02]">
      <img
        src={user.style.profileImage.default}
        alt={`${user.name}'s avatar`}
        class="w-16 h-16 rounded-full object-cover"
        width="64"
        height="64"
      />
      <div>
        <h2 class="text-xl font-semibold">{user.name}</h2>
        <Show when={user.liveState.isLive}>
          <span class="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">Live</span>
        </Show>
        <Show when={user.tags.length > 0}>
          <div class="flex flex-wrap gap-1 mt-1">
            {user.tags.map(tag => (
              <span class="text-xs bg-white px-2 py-0.5 rounded">{tag.label}</span>
            ))}
          </div>
        </Show>
      </div>
    </a>
  );
};

export default UserListItem;
