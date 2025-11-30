import {type Component} from "solid-js";
import {UserProvider} from "../providers/UserProvider.tsx";
import type {User} from "../../../../../lib/auth/User.ts";
import {FaSolidChevronLeft} from "solid-icons/fa";
import {UserBlocksSection} from "./UserBlocksSection.tsx";
import {QueryClientProvider} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";
import {UserBlockProvider} from "./UserBlockProvider.tsx";
import { UserDashboardFeedback } from '../UserDashboardFeedback.tsx'

interface UserBlocksPageProps {
  user: User
}

export const UserBlocksPage: Component<UserBlocksPageProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <UserProvider user={props.user}>
        <UserBlockProvider>
          <UserBlocksPageContent/>
        </UserBlockProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

const UserBlocksPageContent: Component = () => {
  return (
    <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
      <UserBlocksHeader/>
      <div class="bg-white rounded-2xl shadow-xl">
        <UserBlocksSection/>
      </div>
    </div>
  );
};

const UserBlocksHeader: Component = () => {
  return (
    <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div class="flex flex-col gap-4">
        <div>
          <a href={`/dashboard`} class="text-primary hover:underline flex flex-row gap-1 items-center">
            <FaSolidChevronLeft/><p>Back to Dashboard</p>
          </a>
        </div>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Block Users</h2>
        </div>
        <UserDashboardFeedback/>
      </div>
    </div>
  );
};
