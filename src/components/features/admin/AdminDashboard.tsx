import {type Component} from "solid-js";
import {QueryClientProvider} from "@tanstack/solid-query";
import {QueryClient} from "@tanstack/query-core";
import {TagsCategoriesSection} from "./tags/TagsCategoriesSection.tsx";

interface AdminDashboardProps {
}

export const AdminDashboard: Component<AdminDashboardProps> = (props) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div class='flex flex-col'>
        <TagsCategoriesSection/>
      </div>
    </QueryClientProvider>
  );
}
