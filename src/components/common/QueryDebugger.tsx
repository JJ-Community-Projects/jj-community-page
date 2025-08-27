import type { UseQueryResult } from "@tanstack/solid-query";
import { type Component, Switch, Match, Show } from "solid-js";

interface QueryDebuggerProps<TData = unknown, TError = unknown> {
  /** The TanStack Query result object from useQuery */
  query: UseQueryResult<TData, TError>;
}

/**
 * A debug component that displays the current state of a TanStack Query
 *
 * This component is intended for development/debugging purposes only.
 * It displays the current query state as text using SolidJS Switch component.
 *
 * @example
 * ```tsx
 * const userQuery = useQuery(() => ({ queryKey: ['user'], queryFn: fetchUser }));
 *
 * <QueryDebugger query={userQuery} />
 * ```
 */
export const QueryDebugger: Component<QueryDebuggerProps> = (props) => {
  return (
    <div class="p-3 bg-gray-100 border-l-4 border-blue-500 rounded text-sm font-mono">
      <div class="font-bold text-gray-700 mb-2">Query Debug State:</div>
      <Switch>
        <Match when={props.query.isPending}>
          <span class="text-yellow-600">⏳ PENDING - Query is loading for the first time</span>
        </Match>
        <Match when={props.query.isLoading}>
          <span class="text-yellow-600">🔄 LOADING - Query is fetching (no cached data)</span>
        </Match>
        <Match when={props.query.isError}>
          <span class="text-red-600">❌ ERROR - Query failed: {String(props.query.error)}</span>
        </Match>
        <Match when={props.query.isSuccess && props.query.isRefetching}>
          <span class="text-blue-600">🔄 SUCCESS + REFETCHING - Has data, updating in background</span>
        </Match>
        <Match when={props.query.isSuccess}>
          <span class="text-green-600">✅ SUCCESS - Query completed successfully</span>
        </Match>
        <Match when={true}>
          <span class="text-gray-600">❓ UNKNOWN - Unexpected state</span>
        </Match>
      </Switch>

      <div class="mt-2 text-xs text-gray-600">
        Status: <span class="font-semibold">{props.query.status}</span>
        <Show when={props.query.fetchStatus}>
          <> | Fetch Status: <span class="font-semibold">{props.query.fetchStatus}</span></>
        </Show>
        <Show when={props.query.isStale}>
          <> | <span class="text-orange-500">STALE</span></>
        </Show>
        <Show when={props.query.failureCount > 0}>
          <> | Failures: <span class="text-red-500">{props.query.failureCount}</span></>
        </Show>
      </div>
    </div>
  );
};
