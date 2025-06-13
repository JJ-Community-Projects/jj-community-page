import {createMergeableStore} from "tinybase";
import {createEffect, createSignal, onCleanup} from "solid-js";
import {createWsSynchronizer, type WsSynchronizer} from "tinybase/synchronizers/synchronizer-ws-client";
import ReconnectingWebSocket from "reconnecting-websocket";

export const useTinystore = (url: string) => {

  const clientStore = createMergeableStore()
  const [sync, setSync] = createSignal<WsSynchronizer<ReconnectingWebSocket> | undefined>()
  const [listeners, setListeners] = createSignal<string[]>([])

  const addListener = (l: string) => {
    setListeners((s) => s.concat(l))
  }

  createEffect(async () => {
    console.log('useTinystore', 'createEffect')
    const clientSynchronizer = await createWsSynchronizer(
      clientStore,
      new ReconnectingWebSocket(url),
    )
    if (clientSynchronizer) {
      await clientSynchronizer.startSync()
      console.log('sync synchronizer started')
    }
    setSync(clientSynchronizer)
  })

  onCleanup(async () => {
    for (const listenerId of listeners()) {
      clientStore.delListener(listenerId);
    }
    if (sync()) {
      await sync()!.stopSync()
      console.log('sync synchronizer stopped')
    }
  })

  return {
    sync,
    clientStore,
    addListener
  }
}
