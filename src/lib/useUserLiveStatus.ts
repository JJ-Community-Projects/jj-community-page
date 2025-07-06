import {useTinystore} from "./useTinystore.ts";
import {createStore} from "solid-js/store";
import type {UserLiveState} from "./db/models/user-ui.ts";


export function useUserLiveStatus(userId: number) {
  const hostname = window.location.hostname
  const port = window.location.port
  const protocol = window.location.protocol
  const ws = (protocol === "http:" || protocol === "http") ? "ws" : "wss";
  const isProd = ws === 'wss';
  const url = isProd ? `wss://${hostname}/api/ws/live/users/${userId}` :
    `ws://${hostname}:${port}/api/ws/live/users/${userId}`
  console.log('useUserHook', url)
  const {clientStore, addListener} = useTinystore(url)

  const [status, setStatus] = createStore<UserLiveState>({
    id: -1,
    name: '',
    slug: '',
    isLive: false,
    primaryLiveStream: '',
    channel: {}
  })

  addListener(clientStore.addValueListener('state', (s, id, newValue) => {
    if (newValue === undefined) {
      return;
    }
    console.log('useUserLiveStatus', 'state')
    setStatus(JSON.parse(newValue as string));
  }))


  return status;
}
