import {createStore} from "solid-js/store";

/**
 * Creates a default action state object where all specified actions have
 * actionInProgress set to false and lastErrorMessage undefined.
 *
 * @template T - The type of action names (usually a string literal union)
 * @param actions - Array of action names to include in the default state
 * @returns An object with default state for each action
 *
 * @example
 * ```tsx
 * // Define your action types
 * type MyActions = 'fetchUsers' | 'createUser' | 'updateUser' | 'deleteUser';
 *
 * // Create default states for all actions
 * const defaultState = createDefaultActionState<MyActions>(['fetchUsers', 'createUser', 'updateUser', 'deleteUser']);
 *
 * // Use with createAction
 * const actionStore = createAction<MyActions>(defaultState);
 * ```
 */
export function createDefaultActionState<T extends string>(actions: T[]): Actions<T> {
  const defaultState = {} as Actions<T>;

  // Initialize each action with default values
  actions.forEach(action => {
    defaultState[action] = {
      actionInProgress: false,
      lastErrorMessage: undefined
    };
  });

  return defaultState;
}

/**
 * Represents the state of an action.
 * @property actionInProgress - Boolean flag indicating if the action is currently executing
 * @property lastErrorMessage - Optional string containing the last error message if the action failed
 */
export type ActionState = {
  actionInProgress: boolean;
  lastErrorMessage?: string;
};

/**
 * Generic type for mapping action names to their states.
 * @template T - The type of action names (usually a string literal union)
 */
export type Actions<T extends string> = {
  [K in T]: ActionState;
};

/**
 * Creates a generic action store with methods to manage action states.
 * This hook allows tracking loading states and errors for multiple actions.
 *
 * @template T - The type of action names (usually a string literal union)
 * @param initialActions - Optional initial state for actions
 * @param actionNames - Optional array of action names to create default states for when initialActions is not provided or incomplete
 * @returns An object containing:
 *   - actions: The current state of all actions
 *   - startAction: Function to mark an action as started
 *   - stopAction: Function to mark an action as completed
 *   - setLastError: Function to set an error message for an action
 *   - isActionInProgress: Function to check if an action is in progress
 *   - getLastErrorMessage: Function to get the last error message for an action
 *
 * @example
 * ```tsx
 * // Define your action types
 * type MyActions = 'fetchUsers' | 'createUser' | 'updateUser' | 'deleteUser';
 *
 * // Create the action store with default states for all actions
 * const {
 *   actions,
 *   startAction,
 *   stopAction,
 *   setLastError,
 *   isActionInProgress,
 *   getLastErrorMessage
 * } = createAction<MyActions>(undefined, ['fetchUsers', 'createUser', 'updateUser', 'deleteUser']);
 *
 * // Use in an async function
 * const fetchUsers = async () => {
 *   startAction('fetchUsers');
 *   try {
 *     const users = await api.getUsers();
 *     // Process users...
 *     stopAction('fetchUsers');
 *     return users;
 *   } catch (error) {
 *     const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
 *     setLastError('fetchUsers', errorMsg);
 *     stopAction('fetchUsers');
 *     throw error;
 *   }
 * };
 *
 * // Check action state in UI
 * <Show when={isActionInProgress('fetchUsers')}>
 *   <LoadingSpinner />
 * </Show>
 *
 * <Show when={getLastErrorMessage('fetchUsers')}>
 *   <ErrorMessage message={getLastErrorMessage('fetchUsers')} />
 * </Show>
 * ```
 */
export function createAction<T extends string = string>(
  initialActions?: Partial<Actions<T>>,
  actionNames?: T[]
) {
  // Initialize the action states with default values or provided initial states
  let initialState: Actions<T>;

  if (actionNames && actionNames.length > 0) {
    // Create default states for all specified actions
    const defaultState = createDefaultActionState<T>(actionNames);

    // Merge with any provided initialActions
    initialState = initialActions
      ? { ...defaultState, ...initialActions }
      : defaultState;
  } else {
    // No actionNames provided, use initialActions as is or empty object
    initialState = initialActions ? { ...initialActions } as Actions<T> : {} as Actions<T>;
  }

  // Create the store for actions
  const [actions, setActions] = createStore<Actions<T>>(initialState);

  /**
   * Marks an action as started by setting actionInProgress to true and clearing any previous error.
   * @param key - The name of the action to start
   */
  const startAction = (key: T) => {
    // Set action as in progress and clear any previous error
    setActions((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        actionInProgress: true,
        lastErrorMessage: undefined,
      }
    }));

  };

  /**
   * Marks an action as completed by setting actionInProgress to false.
   * @param key - The name of the action to stop
   */
  const stopAction = (key: T) => {
    // Update the action state, creating it if it doesn't exist
    setActions((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        actionInProgress: false,
      }
    }));
  };

  /**
   * Sets an error message for an action.
   * @param key - The name of the action
   * @param error - The error message
   */
  const setLastError = (key: T, error: string) => {
    // Update the action state, creating it if it doesn't exist
    setActions((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        actionInProgress: false,
        lastErrorMessage: error,
      }
    }));
  };

  /**
   * Checks if an action is currently in progress.
   * @param key - The name of the action to check
   * @returns True if the action is in progress, false otherwise
   */
  const isActionInProgress = (key: T): boolean => {
    return actions[key]?.actionInProgress || false;
  };

  /**
   * Gets the last error message for an action.
   * @param key - The name of the action
   * @returns The last error message, or undefined if there is no error
   */
  const getLastErrorMessage = (key: T): string | undefined => {
    return actions[key]?.lastErrorMessage;
  };

  return {
    actions,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage,
  };
}

// Example usage:
// This example shows how to use the createAction hook with different approaches

/*
import { createAction, createDefaultActionState } from '../functions/createAction';
import { Show } from 'solid-js';

// Define the possible actions for your component
type UserActions = 'fetchUser' | 'updateUser' | 'deleteUser';

// Approach 1: Using actionNames parameter (recommended)
function UserProfile(props: { userId: number }) {
  // Create the action store with default states for all actions using actionNames
  const {
    actions,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage
  } = createAction<UserActions>(
    undefined, // No initial actions needed
    ['fetchUser', 'updateUser', 'deleteUser'] // All actions will get default states
  );

  // Function to fetch user data
  const fetchUser = async () => {
    startAction('fetchUser');
    try {
      // Simulate API call
      const response = await fetch(`/api/users/${props.userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      const userData = await response.json();
      stopAction('fetchUser');
      return userData;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('fetchUser', errorMsg);
      stopAction('fetchUser');
      throw error;
    }
  };

  return (
    <div>
      <h2>User Profile</h2>

      {/* Show loading indicator when fetching user *//*}
      <Show when={isActionInProgress('fetchUser')}>
        <div>Loading user data...</div>
      </Show>

      {/* Show error message if fetch failed *//*}
      <Show when={getLastErrorMessage('fetchUser')}>
        <div class="error">Error: {getLastErrorMessage('fetchUser')}</div>
      </Show>

      <button
        onClick={fetchUser}
        disabled={isActionInProgress('fetchUser')}
      >
        {isActionInProgress('fetchUser') ? 'Loading...' : 'Refresh User Data'}
      </button>
    </div>
  );
}

// Approach 2: Using createDefaultActionState explicitly
function AlternativeUserProfile1(props: { userId: number }) {
  // Create default states for all actions
  const defaultState = createDefaultActionState<UserActions>(['fetchUser', 'updateUser', 'deleteUser']);

  // Create the action store with default states
  const {
    actions,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage
  } = createAction<UserActions>(defaultState);

  // Rest of component implementation...
}

// Approach 3: Providing partial initial states with actionNames
function AlternativeUserProfile2(props: { userId: number }) {
  // Create the action store with some custom initial states and default states for the rest
  const {
    actions,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage
  } = createAction<UserActions>(
    {
      // Custom initial state for fetchUser
      fetchUser: {
        actionInProgress: true, // Start with fetchUser in progress
        lastErrorMessage: undefined
      }
    },
    ['fetchUser', 'updateUser', 'deleteUser'] // All actions will get default states, but fetchUser will use the custom state
  );

  // Rest of component implementation...
}

// Approach 4: Manually specifying all initial states (legacy approach)
function AlternativeUserProfile3(props: { userId: number }) {
  // Create the action store with manually specified initial states
  const {
    actions,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage
  } = createAction<UserActions>({
    // Optional initial states
    fetchUser: { actionInProgress: false },
    updateUser: { actionInProgress: false },
    deleteUser: { actionInProgress: false }
  });

  // Rest of component implementation...
}
*/
