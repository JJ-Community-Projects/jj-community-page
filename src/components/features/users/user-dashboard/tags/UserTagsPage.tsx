import {type Component} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {FaSolidChevronLeft} from "solid-icons/fa";
import {UserTagsSection} from "./UserTagsSection.tsx";
import {QueryClientProvider} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";

interface UserTagsPageProps {
  user: User
}

export const UserTagsPage: Component<UserTagsPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <UserTagsPageContent/>
      </UserProvider>
    </QueryClientProvider>
  );
};

const UserTagsPageContent: Component = () => {
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <UserTagsHeader/>
      <div class="bg-white rounded-2xl shadow-xl">
        <UserTagsSection/>
      </div>
    </div>
  );
};

const UserTagsHeader: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Dashboard</p>
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Your Tags</h2>
        </div>
      </div>
    </div>
  );
};
