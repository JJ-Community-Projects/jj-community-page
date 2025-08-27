import type {UseMutationResult} from "@tanstack/solid-query";
import {type Component, Match, Show, Switch} from "solid-js";

interface MutationDebuggerProps<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown> {
  /** The TanStack Mutation result object from useMutation */
  mutation: UseMutationResult<TData, TError, TVariables, TContext>;
}

/**
 * A debug component that displays the current state of a TanStack Mutation
 *
 * This component is intended for development/debugging purposes only.
 * It displays the current mutation state as text using SolidJS Switch component.
 *
 * @example
 * ```tsx
 * const createUserMutation = useMutation(() => ({
 *   mutationFn: (userData) => createUser(userData)
 * }));
 *
 * <MutationDebugger mutation={createUserMutation} />
 * ```
 */
export const MutationDebugger: Component<MutationDebuggerProps<any, any, any, any>> = (props) => {
  return (
    <div class="p-3 bg-gray-100 border-l-4 border-purple-500 rounded text-sm font-mono">
      <div class="font-bold text-gray-700 mb-2">Mutation Debug State:</div>
      <Switch>
        <Match when={props.mutation.isIdle}>
          <span class="text-gray-600">💤 IDLE - Mutation has not been called yet</span>
        </Match>
        <Match when={props.mutation.isPending}>
          <span class="text-yellow-600">⏳ PENDING - Mutation is currently executing</span>
        </Match>
        <Match when={props.mutation.isError}>
          <span class="text-red-600">❌ ERROR - Mutation failed: {String(props.mutation.error)}</span>
        </Match>
        <Match when={props.mutation.isSuccess}>
          <span class="text-green-600">✅ SUCCESS - Mutation completed successfully</span>
        </Match>
        <Match when={true}>
          <span class="text-gray-600">❓ UNKNOWN - Unexpected state</span>
        </Match>
      </Switch>

      <div class="mt-2 text-xs text-gray-600">
        Status: <span class="font-semibold">{props.mutation.status}</span>
        <Show when={props.mutation.failureCount > 0}>
          <> | Failures: <span class="text-red-500">{props.mutation.failureCount}</span></>
        </Show>
        <Show when={props.mutation.failureReason}>
          <> | Failure Reason: <span class="text-red-500">{String(props.mutation.failureReason)}</span></>
        </Show>
        <Show when={props.mutation.submittedAt}>
          <> | Submitted: <span class="font-semibold">{new Date(props.mutation.submittedAt).toLocaleTimeString()}</span></>
        </Show>
      </div>
    </div>
  );
};
