import {type Component} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {FaSolidChevronLeft} from "solid-icons/fa";
import {UserFriendsSection} from "./UserFriendsSection.tsx";
import {QueryClientProvider} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";
import {UserFriendsProvider} from "./UserFriendsProvider.tsx";

interface UserFriendsPageProps {
  user: User
}

export const UserFriendsPage: Component<UserFriendsPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <UserFriendsProvider>
          <UserFriendsPageContent/>
        </UserFriendsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

const UserFriendsPageContent: Component = () => {
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <UserFriendsHeader/>
      <div class="bg-white rounded-2xl shadow-xl">
        <UserFriendsSection/>
      </div>
    </div>
  );
};

const UserFriendsHeader: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Dashboard</p>
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Your Friends</h2>
        </div>
      </div>
    </div>
  );
};
