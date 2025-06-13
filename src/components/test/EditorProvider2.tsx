import {
  createContext,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  useContext
} from "solid-js";
import {createStore} from "solid-js/store";
import {createMergeableStore} from "tinybase/mergeable-store";
import {createWsSynchronizer} from "tinybase/synchronizers/synchronizer-ws-client";
import ReconnectingWebSocket from "reconnecting-websocket";
import {useTinystore} from "../../lib/useTinystore.ts";




const StreamSchema = {
  title: {type: "string"},
  subtitle: {type: "string"},
  start: {type: "string"},
  end: {type: "string"},
}

const useStore = (url: string) => {

  const clientStore = createMergeableStore()

  const [sync] = createResource(async () => {
    const clientSynchronizer = await createWsSynchronizer(
      clientStore,
      new ReconnectingWebSocket(url),
    );
    return {
      clientStore, clientSynchronizer,
    }
  })

  createEffect(async () => {
    if (sync.latest) {
      await sync.latest.clientSynchronizer.startSync()
      console.log('sync synchronizer started')
    }
  })

  onCleanup(() => {
    if (sync.latest) {
      sync.latest.clientSynchronizer.stopSync()
      console.log('sync synchronizer stopped')
    }
  })

  return {
    sync: sync.latest,
    clientStore
  }
}


const useEditorHook = (id: string) => {
  const [schedule, setSchedule] = createStore<any>({
    streams: [],
    schedule: {
      title: '',
      year: 2025,
    }
  });

  const {clientStore} = useTinystore(`ws://localhost:3000/api/test/${id}`)

  const [listeners, setListeners] = createSignal<string[]>([])

  const addListener = (l: string) => {
    setListeners((s) => s.concat(l))
  }

  onMount(() => {
    console.log('sync synchronizer clientSynchronizer')
    addListener(clientStore.addTableListener('streams', (s ) => {
      console.log('streams changed', s.getJson());

    }))

    addListener(clientStore.addCellListener('streams', null, null, (store, table, row, cell, v, b, change) => {

      console.log('cell', table, row, cell, v, b);

    }))


    addListener(clientStore.addValueListener('title', (e, key) => {
      console.log('value changed', e.getJson());
      const v = e.getValue(key)
      console.log('value changed', key, v);
      setSchedule('schedule', key, v as string)
    }))
    addListener(clientStore.addValueListener('year', (e, key) => {
      console.log('value changed', e.getJson());
      const v = e.getValue(key)
      console.log('value changed', key, v);
      setSchedule('schedule', key, v as number)
    }))
  })

  onCleanup(() => {
    for (const listenerId of listeners()) {
      clientStore.delListener(listenerId);
    }
  })


  const addStream = (stream: any) => {
    clientStore.addRow('streams', {
      title: stream.title,
      subtitle: stream.subtitle,
      start: stream.start.toISOString(),
      end: stream.end.toISOString(),
    }, true);
  };

  // updateStream helper automatically reads the expected version from the current state.
  const updateStream = (id: string, updatedFields: Partial<any>) => {

    clientStore.transaction(() => {
      if (updatedFields.title) {
        clientStore.setCell('streams', id, 'title', updatedFields.title);
      }

      if (updatedFields.subtitle) {
        clientStore.setCell('streams', id, 'subtitle', updatedFields.subtitle);
      }

      if (updatedFields.start) {
        clientStore.setCell('streams', id, 'start', updatedFields.start.toISOString())
      }

      if (updatedFields.end) {
        clientStore.setCell('streams', id, 'end', updatedFields.end.toISOString())
      }
    })
  };

  const deleteStream = (id: string) => {
    clientStore.delRow('streams', id)
  };

  // Helper functions for individual ScheduleMeta properties.
  const updateScheduleTitle = (title: string) => clientStore.setValue('title', title);
  const updateScheduleYear = (year: number) => clientStore.setValue('year', year);

  // Helper functions for individual Stream properties.
  const updateStreamTitle = (id: string, title: string) =>
    updateStream(id, {title});
  const updateStreamSubtitle = (id: string, subtitle: string) =>
    updateStream(id, {subtitle});
  const updateStreamStart = (id: string, start: Date) =>
    updateStream(id, {start});
  const updateStreamEnd = (id: string, end: Date) =>
    updateStream(id, {end});


  return {
    schedule,
    addStream,
    deleteStream,
    updateScheduleTitle,
    updateScheduleYear,
    updateStreamTitle,
    updateStreamSubtitle,
    updateStreamStart,
    updateStreamEnd,
  };
};


interface EditorProps {
  id: string
}

const EditorContext = createContext<ReturnType<typeof useEditorHook>>();

export const EditorProvider2: ParentComponent<EditorProps> = (props) => {
  const hook = useEditorHook(props.id)
  return (
    <EditorContext.Provider value={hook}>
      {props.children}
    </EditorContext.Provider>
  );
}
export const useEditor2 = () => useContext(EditorContext)!
