import {createStore} from "solid-js/store";
import {createContext, onMount, type ParentComponent, useContext} from "solid-js";
import {actions} from "astro:actions";
import {useTinystore} from "../../../../lib/useTinystore.ts";
import type {User} from "../../../../lib/auth/User.ts";

type HookActions = {
  createSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

const initHookState: HookActions = {
  createSchedule: {
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
    }[]
  }>({
    schedules: []
  });

  onMount(() => {
    // Listen for changes to schedules
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

  return {
    local,
    user,
    createSchedule,
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
