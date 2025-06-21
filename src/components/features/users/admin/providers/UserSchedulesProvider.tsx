import {createStore} from "solid-js/store";
import {createContext, onMount, type ParentComponent, useContext} from "solid-js";
import {actions} from "astro:actions";
import {useTinystore} from "../../../../../lib/useTinystore.ts";
import type {User} from "../../../../../lib/auth/User.ts";

type HookActions = {
  createSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  setPrimarySchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  toggleVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

const initHookState: HookActions = {
  createSchedule: {
    actionInProgress: false,
  },
  setPrimarySchedule: {
    actionInProgress: false,
  },
  toggleVisibility: {
    actionInProgress: false,
  },
  deleteSchedule: {
    actionInProgress: false,
  },
}

const useUserSchedulesHook = (user: User) => {
  const {clientStore: store, addListener} = useTinystore(`ws://localhost:3000/api/ws/users/${user.id}`)

  const [action, setAction] = createStore<HookActions>(initHookState)

  const startAction = (key: (keyof HookActions)) => {
    setAction(key, {
      actionInProgress: true,
      lastErrorMessage: undefined,
    })
  }

  const stopAction = (key: (keyof HookActions)) => {
    setAction(key, 'actionInProgress', false)
  }

  const setLastError = (key: (keyof HookActions), error: string) => {
    setAction(key, 'lastErrorMessage', error)
  }

  const [local, setLocal] = createStore<{
    schedules: {
      id: number;
      title: string;
      year: number;
      visible: boolean;
      primary: boolean;
      slug: string
    }[]
  }>({
    schedules: []
  });

  onMount(() => {
    // Listen for changes to schedules (row additions/removals)
    addListener(store.addHasRowListener(
      'schedules', null,
      (s, __, rowId, added) => {
        const scheduleId = parseInt(rowId);
        if (added) {
          const value = s.getRow('schedules', rowId);
          const schedule = {
            id: value.id as number,
            title: value.title as string,
            year: value.year as number,
            visible: value.visible as boolean,
            primary: value.primary as boolean,
            slug: value.slug as string,
          }
          setLocal('schedules', (schedules) =>
            schedules.concat(schedule).sort((a, b) => b.year - a.year)); // Sort by year descending
        } else {
          setLocal('schedules', (schedules) => {
            return schedules.filter((s) => s.id !== scheduleId);
          });
        }
      }
    ));

    // Listen for changes to schedule cells (updates to existing schedules)
    addListener(store.addCellListener(
      'schedules', null, 'primary',
      (s, __, rowId) => {
        const scheduleId = parseInt(rowId);
        const value = s.getRow('schedules', rowId);

        // Update the schedule in the local store
        setLocal('schedules', (schedules) => {
          return schedules.map(schedule => {
            if (schedule.id === scheduleId) {
              return {
                ...schedule,
                primary: value.primary as boolean
              };
            }
            // If this is in the same year as the updated schedule and the updated schedule is now primary,
            // then this schedule should not be primary
            if (schedule.year === value.year && value.primary === true) {
              return {
                ...schedule,
                primary: false
              };
            }
            return schedule;
          });
        });
      }
    ));

    // Listen for changes to visibility
    addListener(store.addCellListener(
      'schedules', null, 'visible',
      (s, __, rowId) => {
        const scheduleId = parseInt(rowId);
        const value = s.getRow('schedules', rowId);

        // Update the schedule in the local store
        setLocal('schedules', (schedules) => {
          return schedules.map(schedule => {
            if (schedule.id === scheduleId) {
              return {
                ...schedule,
                visible: value.visible as boolean
              };
            }
            return schedule;
          });
        });
      }
    ));
  });

  // Create a new schedule - this will call the API endpoint, not directly modify the UserDO
  const createSchedule = async () => {
    startAction('createSchedule')
    const schedule = await actions.schedules.create()
    stopAction('createSchedule')
    if (schedule.error) {
      setLastError('createSchedule', schedule.error.message || 'Failed to create schedule');
      throw new Error(schedule.error.message || 'Failed to create schedule');
    } else {
      return schedule;
    }
  };

  // Set a schedule as primary - this will call the API endpoint
  const setPrimarySchedule = async (scheduleId: number) => {
    startAction('setPrimarySchedule')
    const result = await actions.schedules.setPrimary({ scheduleId })
    stopAction('setPrimarySchedule')
    if (result.error) {
      setLastError('setPrimarySchedule', result.error.message || 'Failed to set schedule as primary');
      throw new Error(result.error.message || 'Failed to set schedule as primary');
    } else {
      return result;
    }
  };

  // Toggle the visibility of a schedule - this will call the API endpoint
  const toggleVisibility = async (scheduleId: number) => {
    startAction('toggleVisibility')
    const result = await actions.schedules.toggleVisibility({ scheduleId })
    stopAction('toggleVisibility')
    if (result.error) {
      setLastError('toggleVisibility', result.error.message || 'Failed to toggle schedule visibility');
      throw new Error(result.error.message || 'Failed to toggle schedule visibility');
    } else {
      return result;
    }
  };

  // Delete a schedule - this will call the API endpoint
  const deleteSchedule = async (scheduleId: number) => {
    startAction('deleteSchedule')
    const result = await actions.schedules.delete(scheduleId)
    stopAction('deleteSchedule')
    if (result.error) {
      setLastError('deleteSchedule', result.error.message || 'Failed to delete schedule');
      throw new Error(result.error.message || 'Failed to delete schedule');
    } else {
      return result;
    }
  };

  return {
    local,
    user,
    createSchedule,
    setPrimarySchedule,
    toggleVisibility,
    deleteSchedule,
    // Action state
    action: action
  };
};

interface UserSchedulesProps {
  user: User
}

const UserSchedulesContext = createContext<ReturnType<typeof useUserSchedulesHook>>();

export const UserSchedulesProvider: ParentComponent<UserSchedulesProps> = (props) => {
  const hook = useUserSchedulesHook(props.user);
  return (
    <UserSchedulesContext.Provider value={hook}>{props.children}</UserSchedulesContext.Provider>
  );
};

export const useUserSchedules = () => useContext(UserSchedulesContext)!;
