import {createMergeableStore} from "tinybase/mergeable-store";
import {createStore} from "solid-js/store";
import {DateTime} from "luxon";
import {sanitizeTag} from "../../../../../functions/slug.ts";

import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  useContext
} from "solid-js";

import type {Row} from "tinybase/store";
import {createWsSynchronizer, type WsSynchronizer} from "tinybase/synchronizers/synchronizer-ws-client";
import ReconnectingWebSocket from "reconnecting-websocket";
import {actions} from "astro:actions";


// region Initialization
/**
 * The main hook that powers the Schedule Editor functionality.
 *
 * This hook creates and manages:
 * 1. A TinyBase store that synchronizes with the server via WebSocket
 * 2. A local SolidJS store for UI rendering
 * 3. Action tracking for loading states and errors
 * 4. Methods for manipulating schedule data
 *
 * The hook sets up listeners to keep the local store in sync with the TinyBase store,
 * which in turn stays in sync with the server. This enables real-time collaborative
 * editing where changes made by one user are immediately visible to others.
 *
 * @param id - The ID of the schedule being edited
 * @param userId - The ID of the current user
 * @param username - The username of the current user
 * @returns An object containing the local state and methods for manipulating the schedule
 */
const useScheduleEditorHook = (id: number, userId: number,
                               username: string) => {

  const store = createMergeableStore()

  const [listener, setListener] = createSignal<string[]>([])

  const addListener = (id: string) => setListener((ids) => ids.concat(id));

  const [sync, setSync] = createSignal<WsSynchronizer<any> | undefined>()

  onMount(async () => {
    const hostname = window.location.hostname
    const port = window.location.port
    const isProd = import.meta.env.PROD
    const url = isProd ? `wss://${hostname}/api/ws/schedules/${id}/editor`:
      `ws://${hostname}:${port}/api/ws/schedules/${id}/editor`
    console.log('useScheduleEditorHook', url)
    const clientSynchronizer = await createWsSynchronizer(
      store,
      new ReconnectingWebSocket(url),
    );
    await clientSynchronizer.startSync()
    setSync(clientSynchronizer)
  })

  onCleanup(() => {
    for (const l in listener()) {
      store.delListener(l)
    }
    sync()?.stopSync()
  })


  return {
    store,
    addListener,
    sync
  }
}

interface ScheduleEditorProps {
  id: number
  userId: number
  username: string
}

const ScheduleEditorContext = createContext<ReturnType<typeof useScheduleEditorHook>>();

export const ScheduleEditorConnectionProvider: ParentComponent<ScheduleEditorProps> = (props) => {
  const hook = useScheduleEditorHook(props.id, props.userId, props.username);
  return (
    <ScheduleEditorContext.Provider value={hook}>{props.children}</ScheduleEditorContext.Provider>
  );
}
export const useScheduleEditorConnection = () => useContext(ScheduleEditorContext)!
