import type {UseQueryResult} from "@tanstack/solid-query";
import {useQuery} from "@tanstack/solid-query";
import {type Accessor, createMemo, type JSX, Match, Show, Switch} from "solid-js";
import type {QueryOptionsBase} from "@orpc/tanstack-query";

/**
 * Props for the QueryComponent
 *
 * @template TData - The type of data returned by the query
 * @template TError - The type of error that can be thrown by the query
 */
interface RawQueryComponentProps<TData, TError> {
  /** The TanStack Query result object containing query state and data */
  query: UseQueryResult<TData, TError>;

  /**
   * Function that renders the successful data state
   * @param data - The successfully fetched data
   * @returns JSX element to render
   */
  children: (data: TData) => JSX.Element;

  /**
   * Optional function to render custom loading state
   * @returns JSX element to render while loading
   */
  loading?: () => JSX.Element;

  /**
   * Optional function to render custom error state
   * @param error - The error that occurred
   * @param refetch - Function to retry the query
   * @param failureCount - Number of times the query has failed
   * @returns JSX element to render on error
   */
  error?: (error: TError, refetch: () => void, failureCount: number) => JSX.Element;

  /**
   * Optional function to render custom background refetching indicator
   * @param data - The current (possibly stale) data
   * @returns JSX element to render while refetching in background
   */
  refetching?: (data: TData) => JSX.Element;

  /**
   * Whether to show stale data indicator when data is stale
   * @default false
   */
  showStaleIndicator?: boolean;

  /**
   * Whether to show background refetch indicator
   * @default true
   */
  showRefetchingIndicator?: boolean;
}

/**
 * Props for the QueryOptionsComponent - accepts query options instead of query result
 *
 * @template TData - The type of data returned by the query
 * @template TError - The type of error that can be thrown by the query
 */
interface QueryComponentProps<TData, TError> {
  /** TanStack Query options (e.g., from orpc.procedure.queryOptions) */
  queryOptions: Accessor<QueryOptionsBase<TData, TError>>; // Using any to match the flexible query options structure

  /**
   * Function that renders the successful data state
   * @param data - The successfully fetched data
   * @returns JSX element to render
   */
  children: (data: TData) => JSX.Element;

  /**
   * Optional function to render custom loading state
   * @returns JSX element to render while loading
   */
  loading?: () => JSX.Element;

  /**
   * Optional function to render custom error state
   * @param error - The error that occurred
   * @param refetch - Function to retry the query
   * @param failureCount - Number of times the query has failed
   * @returns JSX element to render on error
   */
  error?: (error: TError, refetch: () => void, failureCount: number) => JSX.Element;

  /**
   * Optional function to render custom background refetching indicator
   * @param data - The current (possibly stale) data
   * @returns JSX element to render while refetching in background
   */
  refetching?: (data: TData) => JSX.Element;

  /**
   * Whether to show stale data indicator when data is stale
   * @default false
   */
  showStaleIndicator?: boolean;

  /**
   * Whether to show background refetch indicator
   * @default true
   */
  showRefetchingIndicator?: boolean;
}

/**
 * A comprehensive query state management component for TanStack Query
 *
 * This component handles all query states (pending, error, success) and provides
 * additional features like:
 * - Background refetching indicators
 * - Stale data indicators
 * - Enhanced error handling with retry functionality
 * - Flexible rendering options for different states
 *
 * @example
 * ```tsx
 * <QueryComponent
 *   query={userQuery}
 *   loading={() => <div class="spinner">Loading user...</div>}
 *   error={(error, refetch, failureCount) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <p>Attempts: {failureCount}</p>
 *       <button onClick={refetch}>Retry</button>
 *     </div>
 *   )}
 *   refetching={(data) => (
 *     <div>
 *       <UserProfile user={data} />
 *       <div class="updating-indicator">Updating...</div>
 *     </div>
 *   )}
 *   showStaleIndicator={true}
 * >
 *   {(user) => <UserProfile user={user} />}
 * </QueryComponent>
 * ```
 */
export function RawQueryComponent<TData, TError>(props: RawQueryComponentProps<TData, TError>) {
  // Memoized refetch function to prevent unnecessary re-renders
  const refetch = createMemo(() => () => props.query.refetch());

  return (
    <Switch>
      {/* Initial loading state - no data available yet */}
      <Match when={props.query.isPending}>
        {props.loading?.() ?? <div class="query-loading">Loading...</div>}
      </Match>

      {/* Error state - query failed */}
      <Match when={props.query.isError}>
        {props.error?.(
          props.query.error!,
          refetch(),
          props.query.failureCount
        ) ?? (
          <div class="query-error">
            <p>An error occurred while loading data.</p>
            <Show when={props.query.failureCount > 1}>
              <p class="text-sm text-gray-600">
                Failed {props.query.failureCount} times
              </p>
            </Show>
            <button
              onClick={refetch()}
              class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
      </Match>

      {/* Success state - data is available */}
      <Match when={props.query.isSuccess && props.query.data !== undefined}>
        <div class="query-success">
          {/* Show stale indicator if enabled and data is stale */}
          <Show when={props.showStaleIndicator && props.query.isStale}>
            <div class="stale-indicator text-xs text-amber-600 mb-2">
              ⚠️ This data may be outdated
            </div>
          </Show>

          {/* Handle background refetching */}
          <Show
            when={props.query.isRefetching && props.showRefetchingIndicator}
            fallback={props.children(props.query.data!)}
          >
            {props.refetching?.(props.query.data!) ?? (
              <div class="relative">
                {props.children(props.query.data!)}
                <div class="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Updating...
                </div>
              </div>
            )}
          </Show>
        </div>
      </Match>
    </Switch>
  );
}

/**
 * A query component that accepts TanStack query options instead of a query result
 *
 * This component internally uses useQuery with the provided options and delegates
 * all rendering logic to the existing QueryComponent. This allows you to pass
 * query options directly (e.g., from orpc.private.teams.getOwnedTeams.queryOptions)
 * without having to call useQuery yourself.
 *
 * @example
 * ```tsx
 * <QueryOptionsComponent
 *   queryOptions={orpc.private.teams.getOwnedTeams.queryOptions}
 *   loading={() => <div class="spinner">Loading teams...</div>}
 *   error={(error, refetch, failureCount) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={refetch}>Retry</button>
 *     </div>
 *   )}
 * >
 *   {(teams) => <TeamsList teams={teams} />}
 * </QueryOptionsComponent>
 * ```
 */
export function QueryComponent<TData, TError>(props: QueryComponentProps<TData, TError>) {
  // Use the provided query options with useQuery
  const query = useQuery(props.queryOptions);
  // Delegate all rendering logic to the existing QueryComponent
  return (
    <RawQueryComponent
      query={query}
      loading={props.loading}
      error={props.error}
      refetching={props.refetching}
      showStaleIndicator={props.showStaleIndicator}
      showRefetchingIndicator={props.showRefetchingIndicator}
    >
      {props.children}
    </RawQueryComponent>
  );
}
