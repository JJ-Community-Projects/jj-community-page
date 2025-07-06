import {type Component, For, Show} from "solid-js";
import type {UserPageUI} from "../../../../lib/db/models/user-ui";
import UserListItem from "./UserListItem";

interface UsersPageProps {
  data: UserPageUI[];
}

const UsersPage: Component<UsersPageProps> = (props) => {
  return (
    <div class="w-full max-w-4xl">
      <h1 class="text-4xl text-center text-white mb-8">Users</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Show when={props.data && props.data.length > 0} fallback={
          <div class="col-span-full text-center text-white p-8">
            <p>No users found.</p>
          </div>
        }>
          <For each={props.data}>
            {(user) => (
              <Show when={user}>
                <UserListItem user={user}/>
              </Show>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default UsersPage;
