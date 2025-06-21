import {createMergeableStore} from "tinybase/mergeable-store";
import {createStore} from "solid-js/store";
import {DateTime} from "luxon";
import { sanitizeTag } from "../../../../../functions/slug.ts";

import {
  createContext, createEffect,
  createSignal, on,
  onCleanup,
  onMount,
  type ParentComponent,
  useContext
} from "solid-js";

import type {Row} from "tinybase/store";
import {createWsSynchronizer, type WsSynchronizer} from "tinybase/synchronizers/synchronizer-ws-client";
import ReconnectingWebSocket from "reconnecting-websocket";
import {actions} from "astro:actions";

type HookActions = {
  addNewStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  saveStream: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamTitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamDescription: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamSubtitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamEnd: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamStart: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateStreamVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleTitle: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleYear: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleSlug: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  updateScheduleVisibility: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeTag: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  addParticipant: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  removeParticipant: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  saveSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  deleteSchedule: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
  fetchTags: {
    actionInProgress: boolean,
    lastErrorMessage?: string
  },
}

const initHookState: HookActions = {
  addNewStream: {
    actionInProgress: false,
  },
  updateStream: {
    actionInProgress: false,
  },
  deleteStream: {
    actionInProgress: false,
  },
  saveStream: {
    actionInProgress: false,
  },
  updateStreamTitle: {
    actionInProgress: false,
  },
  updateStreamDescription: {
    actionInProgress: false,
  },
  updateStreamSubtitle: {
    actionInProgress: false,
  },
  updateStreamEnd: {
    actionInProgress: false,
  },
  updateStreamStart: {
    actionInProgress: false,
  },
  updateStreamVisibility: {
    actionInProgress: false,
  },
  updateScheduleTitle: {
    actionInProgress: false,
  },
  updateScheduleYear: {
    actionInProgress: false,
  },
  updateScheduleSlug: {
    actionInProgress: false,
  },
  updateScheduleVisibility: {
    actionInProgress: false,
  },
  addTag: {
    actionInProgress: false,
  },
  removeTag: {
    actionInProgress: false,
  },
  addParticipant: {
    actionInProgress: false,
  },
  removeParticipant: {
    actionInProgress: false,
  },
  saveSchedule: {
    actionInProgress: false,
  },
  deleteSchedule: {
    actionInProgress: false,
  },
  fetchTags: {
    actionInProgress: false,
  },
};

// region Initialization
const useScheduleEditorHook = (id: number, userId: number,
                               username: string) => {

  const store = createMergeableStore()

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

  const [listener, setListener] = createSignal<string[]>([])
  const addListener = (id: string) => setListener((ids) => ids.concat(id));
  const [local, setLocal] = createStore<{
    id: number;
    title: string;
    year: number;
    slug: string;
    visible: boolean;
    streams: {
      id: string;
      title: string;
      description: string;
      subtitle: string;
      start: DateTime,
      end: DateTime,
      visible: boolean,
      tags: { label: string, tag: string }[],
      participants: { userId: number, name: string }[],
      createdBy: number;
    }[],
  }>({
    id: id,
    title: '',
    year: new Date().getFullYear(),
    slug: '',
    visible: false,
    streams: []
  })

  const [sync, setSync] = createSignal<WsSynchronizer<any> | undefined>()
// endregion


  // region Lifecycle Methods
  onMount(async () => {
    const hostname = window.location.hostname
    const port = window.location.port
    const clientSynchronizer = await createWsSynchronizer(
      store,
      new ReconnectingWebSocket(`ws://${hostname}:${port}/api/ws/schedules/${id}/editor?userId=${userId}`),
    );
    await clientSynchronizer.startSync()
    setSync(clientSynchronizer)
  })

  // region listener


  // Add listeners for schedule properties
  addListener(
    store.addValueListener(
      'id',
      (_, __, newValue) => {
        setLocal('id', newValue as number);
      }
    )
  )

  addListener(
    store.addValueListener(
      'title',
      (_, __, newValue) => {
        setLocal('title', newValue as string);
      }
    )
  )
  
  addListener(
    store.addValueListener(
      'visible',
      (_, __, newValue) => {
        setLocal('visible', newValue as boolean);
      }
    )
  )

  addListener(
    store.addValueListener(
      'year',
      (_, __, newValue) => {
        setLocal('year', newValue as number);
      }
    )
  )

  addListener(
    store.addValueListener(
      'slug',
      (_, __, newValue) => {
        setLocal('slug', newValue as string);
      }
    )
  )

  // Add listeners for streams
  addListener(
    store.addHasRowListener(
      'streams', null,
      (s, __, rowId, added) => {
        if (added) {
          const value = s.getRow('streams', rowId);
          console.log('Add row', value)
          setLocal('streams', (streams) => streams.concat(rowToLocal(rowId, value)).sort((a, b) => a.id.localeCompare(b.id)));
        } else {
          console.log('Remove row', rowId)
          setLocal('streams', (streams) => {
            return streams.filter((s) => s.id !== rowId);
          })
        }
      }
    )
  )

  // Add listeners for stream properties
  addListener(
    store.addCellListener('streams', null, 'title',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'title', value as string);
      })
  )

  addListener(
    store.addCellListener('streams', null, 'visible',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'visible', value as boolean);
      })
  )

  addListener(
    store.addCellListener('streams', null, 'subtitle',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'subtitle', value as string);
      })
  )

  addListener(
    store.addCellListener('streams', null, 'description',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'description', value as string);
      })
  )

  addListener(
    store.addCellListener('streams', null, 'start',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'start', DateTime.fromISO(value as string, {zone: 'utc'}).toLocal());
      })
  )

  addListener(
    store.addCellListener('streams', null, 'end',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        setLocal('streams', (s) => {
          return s.id == rowId
        }, 'end', DateTime.fromISO(value as string, {zone: 'utc'}).toLocal());
      })
  )

  // Add listener for streamTags table to update local state when tags change
  addListener(
    store.addTableListener('streamTags', (s, _, tableId) => {
      // When the streamTags table changes, update all streams' tags in the local state
      const streamTags = s.getTable('streamTags');
      const streams = local.streams;

      // Create a map of streamId to tags
      const tagsByStream: { [streamId: string]: {label: string; tag: string}[] } = {};

      // Initialize empty arrays for all streams
      for (const stream of streams) {
        tagsByStream[stream.id] = [];
      }

      // Populate the map with tags from the streamTags table
      for (const tagId in streamTags) {
        const tagEntry = streamTags[tagId];
        const streamId = tagEntry.streamId as string;
        // Use the label for display if available, otherwise use the tag
        const displayTag = (tagEntry.label as string) || (tagEntry.tag as string);

        if (tagsByStream[streamId]) {
          tagsByStream[streamId].push({label: displayTag, tag: tagEntry.tag as string});
        }
      }

      // Update the local state for each stream
      for (const stream of streams) {
        const tags = tagsByStream[stream.id] || [];
        setLocal('streams', (s) => s.id === stream.id, 'tags', tags);
      }
    })
  )

  // Add listener for streamParticipants table to update local state when participants change
  addListener(
    store.addTableListener('streamParticipants', (s, _, tableId) => {
      // When the streamParticipants table changes, update all streams' participants in the local state
      const streamParticipants = s.getTable('streamParticipants');
      const streams = local.streams;

      // Create a map of streamId to participants
      const participantsByStream: { [streamId: string]: {userId: number; name: string}[] } = {};

      // Initialize empty arrays for all streams
      for (const stream of streams) {
        participantsByStream[stream.id] = [];
      }

      // Populate the map with participants from the streamParticipants table
      for (const participantId in streamParticipants) {
        const participantEntry = streamParticipants[participantId];
        const streamId = participantEntry.streamId as string;

        if (participantsByStream[streamId]) {
          participantsByStream[streamId].push({
            userId: participantEntry.userId as number,
            name: participantEntry.providerName as string || 'Unknown'
          });
        }
      }

      // Update the local state for each stream
      for (const stream of streams) {
        const participants = participantsByStream[stream.id] || [];
        setLocal('streams', (s) => s.id === stream.id, 'participants', participants);
      }
    })
  )

  // endregion

  onCleanup(() => {
    for (const l in listener()) {
      store.delListener(l)
    }
    sync()?.stopSync()
  })
  // endregion

  // region Data Conversion
  const rowToLocal = (id: string, row: Row
  ): {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    start: DateTime,
    end: DateTime,
    visible: boolean,
    tags: {label: string, tag: string}[],
    participants: {userId: number, name: string}[],
    createdBy: number;
  } => {
    // Get tags for this stream from the streamTags table
    const tags: {label: string, tag: string}[] = [];
    if (store.hasTable('streamTags')) {
      const streamTags = store.getTable('streamTags');
      for (const tagId in streamTags) {
        const tagEntry = streamTags[tagId];
        if (tagEntry.streamId === id) {
          // Use the label for display if available, otherwise use the tag
          tags.push({
            label: tagEntry.label as string, tag:tagEntry.tag as string
          });
        }
      }
    }

    // Get participants for this stream from the streamParticipants table
    const participants: {userId: number, name: string}[] = [];
    if (store.hasTable('streamParticipants')) {
      const streamParticipants = store.getTable('streamParticipants');
      for (const participantId in streamParticipants) {
        const participantEntry = streamParticipants[participantId];
        if (participantEntry.streamId === id) {
          participants.push({
            userId: participantEntry.userId as number,
            name: participantEntry.providerName as string || 'Unknown'
          });
        }
      }
    }

    return {
      id: id,
      title: row.title as string ?? '',
      subtitle: row.subtitle as string ?? '',
      description: row.description as string ?? '',
      start: DateTime.fromISO(row.start as string ?? '', {zone: 'utc'}).toLocal(),
      end: DateTime.fromISO(row.end as string ?? '', {zone: 'utc'}).toLocal(),
      visible: row.visible as boolean ?? false,
      tags: tags,
      participants: participants,
      createdBy: row.createdBy as number,
    }
  }

  const localToRow = (stream: {
    id: number | string;
    title: string;
    subtitle: string;
    description: string;
    start: DateTime,
    end: DateTime,
    visible: boolean,
    tags?: {label: string, tag: string}[]
    createdBy: number
  }): Row => {
    return {
      title: stream.title ?? '',
      subtitle: stream.subtitle ?? '',
      description: stream.description ?? '',
      visible: stream.visible ?? false,
      start: stream.start.setZone('utc').toISO() ?? '',
      end: stream.end.setZone('utc').toISO() ?? '',
      createdBy: stream.createdBy,
    }
  }
  // endregion


  // region Stream Operations
  const addNewStream = (day?: number) => {
    startAction('addNewStream');
    try {
      const currentYear = new Date().getFullYear();
      let startTime: DateTime;
      let endTime: DateTime;

      // Define the allowed range for streams
      const startOfRange = DateTime.fromObject({year: currentYear, month: 12, day: 1}, {
        zone: 'utc',
      });
      const endOfRange = DateTime.fromObject({
        year: currentYear,
        month: 12,
        day: 14,
        hour: 23,
        minute: 59,
        second: 59
      }, {
        zone: 'utc',
      });

      if (day !== undefined) {
        // If a specific day is provided (for the desktop view)
        startTime = DateTime.fromObject({
          year: currentYear,
          month: 12,
          day: day,
          hour: 11,
          minute: 0
        }, {
          zone: 'utc',
        });
        // End time is 3 hours later at 14:00
        endTime = startTime.plus({hours: 3});
      } else if (local.streams.length === 0) {
        // If there are no streams, set start time to December 1 of current year at 17:00
        startTime = DateTime.fromObject({
          year: currentYear,
          month: 12,
          day: 1,
          hour: 11,
          minute: 0,
        }, {
          zone: 'utc',
        });
        // End time is 3 hours later at 14:00
        endTime = startTime.plus({hours: 3});
      } else {
        // If there are streams, set start time to the end time of the last stream
        const lastStream = local.streams[local.streams.length - 1];

        startTime = lastStream.end;
        // End time is 3 hours later
        endTime = startTime.plus({hours: 3});

        // Ensure the times are within the allowed range
        if (startTime < startOfRange) {
          startTime = startOfRange;
          endTime = startTime.plus({hours: 3});
        }

        if (endTime > endOfRange) {
          endTime = endOfRange;
          // If adjusting end time would make start time before end time, adjust start time too
          if (endTime.diff(startTime, 'hours').hours < 0) {
            startTime = endTime.minus({hours: 3});
            // If this would put start time before the allowed range, alert and return
            if (startTime < startOfRange) {
              const errorMsg = "Cannot add more streams as they would fall outside the allowed date range (December 1 to December 14)";
              alert(errorMsg);
              setLastError('addNewStream', errorMsg);
              stopAction('addNewStream');
              return;
            }
          }
        }
      }

      // Add the new stream
      store.addRow('streams', {
        title: 'New stream',
        subtitle: '',
        description: '',
        visible: false,
        start: startTime.setZone('utc').toISO()!,
        end: endTime.setZone('utc').toISO()!,
        createdBy: userId
      });

      // Ensure the streamTags table exists
      if (!store.hasTable('streamTags')) {
        store.setTable('streamTags', {});
      }
      stopAction('addNewStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('addNewStream', errorMsg);
      stopAction('addNewStream');
      throw error;
    }
  }

  const updateStream = (stream: {
    id: number,
    title: string;
    subtitle: string;
    description: string;
    start: DateTime,
    end: DateTime,
    visible: boolean,
    createdBy: number
  }) => {
    startAction('updateStream');
    try {
      store.setRow('streams', `${id}`, localToRow(stream));
      stopAction('updateStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStream', errorMsg);
      stopAction('updateStream');
      throw error;
    }
  }

  const deleteStream = (id: string) => {
    startAction('deleteStream');
    try {
      // Delete all related tags from the streamTags table
      if (store.hasTable('streamTags')) {
        const streamTags = store.getTable('streamTags');
        for (const tagId in streamTags) {
          const tagEntry = streamTags[tagId];
          if (tagEntry.streamId === id) {
            store.delRow('streamTags', tagId);
          }
        }
      }

      // Delete all related participants from the streamParticipants table
      if (store.hasTable('streamParticipants')) {
        const streamParticipants = store.getTable('streamParticipants');
        for (const participantId in streamParticipants) {
          const participantEntry = streamParticipants[participantId];
          if (participantEntry.streamId === id) {
            store.delRow('streamParticipants', participantId);
          }
        }
      }

      // Delete the stream itself
      store.delRow('streams', id);
      stopAction('deleteStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('deleteStream', errorMsg);
      stopAction('deleteStream');
      throw error;
    }
  }

  const updateStreamTitle = (id: string, title: string) => {
    startAction('updateStreamTitle');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamTitle', errorMsg);
        stopAction('updateStreamTitle');
        return;
      }
      store.setCell('streams', id, 'title', title);
      stopAction('updateStreamTitle');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamTitle', errorMsg);
      stopAction('updateStreamTitle');
      throw error;
    }
  }

  const updateStreamVisibility = (id: string, visible: boolean) => {
    startAction('updateStreamVisibility');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamVisibility', errorMsg);
        stopAction('updateStreamVisibility');
        return;
      }
      store.setCell('streams', id, 'visible', visible);
      stopAction('updateStreamVisibility');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamVisibility', errorMsg);
      stopAction('updateStreamVisibility');
      throw error;
    }
  }

  const updateStreamDescription = (id: string, description: string) => {
    startAction('updateStreamDescription');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamDescription', errorMsg);
        stopAction('updateStreamDescription');
        return;
      }
      store.setCell('streams', id, 'description', description);
      stopAction('updateStreamDescription');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamDescription', errorMsg);
      stopAction('updateStreamDescription');
      throw error;
    }
  }

  const updateStreamSubtitle = (id: string, subtitle: string) => {
    startAction('updateStreamSubtitle');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamSubtitle', errorMsg);
        stopAction('updateStreamSubtitle');
        return;
      }
      store.setCell('streams', id, 'subtitle', subtitle);
      stopAction('updateStreamSubtitle');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamSubtitle', errorMsg);
      stopAction('updateStreamSubtitle');
      throw error;
    }
  }

  const updateStreamEnd = (id: string, end: DateTime) => {
    startAction('updateStreamEnd');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamEnd', errorMsg);
        stopAction('updateStreamEnd');
        return;
      }

      // Get the current start time of the stream
      const stream = local.streams.find(s => s.id === id);
      if (!stream) {
        const errorMsg = 'Stream not found in local state';
        setLastError('updateStreamEnd', errorMsg);
        stopAction('updateStreamEnd');
        return;
      }

      const currentYear = new Date().getFullYear();
      const startOfRange = DateTime.fromObject({year: currentYear, month: 12, day: 1});
      const endOfRange = DateTime.fromObject({year: currentYear, month: 12, day: 14, hour: 23, minute: 59, second: 59});

      // Validate that end time is not before start time
      if (end < stream.start) {
        const errorMsg = "End time cannot be before start time";
        alert(errorMsg);
        setLastError('updateStreamEnd', errorMsg);
        stopAction('updateStreamEnd');
        return;
      }

      // Validate that end time is within the allowed range
      if (end < startOfRange || end > endOfRange) {
        const errorMsg = "Streams can only be scheduled between December 1 and December 14 of the current year";
        alert(errorMsg);
        setLastError('updateStreamEnd', errorMsg);
        stopAction('updateStreamEnd');
        return;
      }

      // Convert to UTC before saving
      store.setCell('streams', id, 'end', end.setZone('utc').toISO() ?? '');
      stopAction('updateStreamEnd');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamEnd', errorMsg);
      stopAction('updateStreamEnd');
      throw error;
    }
  }

  const updateStreamStart = (id: string, start: DateTime) => {
    startAction('updateStreamStart');
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        setLastError('updateStreamStart', errorMsg);
        stopAction('updateStreamStart');
        return;
      }

      // Get the current end time of the stream
      const stream = local.streams.find(s => s.id === id);
      if (!stream) {
        const errorMsg = 'Stream not found in local state';
        setLastError('updateStreamStart', errorMsg);
        stopAction('updateStreamStart');
        return;
      }

      const currentYear = new Date().getFullYear();
      const startOfRange = DateTime.fromObject({year: currentYear, month: 12, day: 1});
      const endOfRange = DateTime.fromObject({year: currentYear, month: 12, day: 14, hour: 23, minute: 59, second: 59});

      // Validate that start time is not after end time
      if (start > stream.end) {
        const errorMsg = "Start time cannot be after end time";
        alert(errorMsg);
        setLastError('updateStreamStart', errorMsg);
        stopAction('updateStreamStart');
        return;
      }

      // Validate that start time is within the allowed range
      if (start < startOfRange || start > endOfRange) {
        const errorMsg = "Streams can only be scheduled between December 1 and December 14 of the current year";
        alert(errorMsg);
        setLastError('updateStreamStart', errorMsg);
        stopAction('updateStreamStart');
        return;
      }

      // Convert to UTC before saving
      store.setCell('streams', id, 'start', start.setZone('utc').toISO() ?? '');
      stopAction('updateStreamStart');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStreamStart', errorMsg);
      stopAction('updateStreamStart');
      throw error;
    }
  }
  // endregion

  // region Schedule Operations
  const updateScheduleTitle = (title: string) => {
    startAction('updateScheduleTitle');
    try {
      store.setValue('title', title);
      stopAction('updateScheduleTitle');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateScheduleTitle', errorMsg);
      stopAction('updateScheduleTitle');
      throw error;
    }
  }

  const updateScheduleYear = (year: number) => {
    startAction('updateScheduleYear');
    try {
      store.setValue('year', year);
      stopAction('updateScheduleYear');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateScheduleYear', errorMsg);
      stopAction('updateScheduleYear');
      throw error;
    }
  }

  const updateScheduleSlug = (slug: string) => {
    startAction('updateScheduleSlug');
    try {
      store.setValue('slug', slug);
      stopAction('updateScheduleSlug');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateScheduleSlug', errorMsg);
      stopAction('updateScheduleSlug');
      throw error;
    }
  }

  const updateScheduleVisibility = (visible: boolean) => {
    startAction('updateScheduleVisibility');
    try {
      store.setValue('visible', visible);
      stopAction('updateScheduleVisibility');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateScheduleVisibility', errorMsg);
      stopAction('updateScheduleVisibility');
      throw error;
    }
  }
  // endregion

  // region Stream Utility Functions
  // Get streams for a specific day (for desktop view)
  const getStreamsByDay = (day: number) => {
    const targetDate = DateTime.fromObject({year: local.year, month: 12, day: day});
    const targetDateStr = targetDate.toFormat('yyyy-MM-dd');

    return local.streams.filter(stream => {
      const streamDate = stream.start.toFormat('yyyy-MM-dd');
      return streamDate === targetDateStr;
    });
  };

  // Get all days between Dec 1 and Dec 14
  const getAllDays = () => {
    const days = [];
    for (let day = 1; day <= 14; day++) {
      days.push(DateTime.fromObject({year: local.year, month: 12, day: day}));
    }
    return days;
  };

  const saveStream = (stream: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    start: DateTime;
    end: DateTime;
    visible: boolean;
    createdBy: number
  }) => {
    startAction('saveStream');
    try {
      if (!store.hasRow('streams', stream.id)) {
        const errorMsg = 'Stream not found';
        console.log('saveStream', 'stream not found', stream);
        setLastError('saveStream', errorMsg);
        stopAction('saveStream');
        return;
      }
      store.setRow('streams', stream.id, {
        id: stream.id,
        title: stream.title,
        subtitle: stream.subtitle,
        description: stream.description,
        visible: stream.visible,
        start: stream.start.setZone('utc').toISO()!,
        end: stream.end.setZone('utc').toISO()!,
        createdBy: stream.createdBy
      });
      stopAction('saveStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('saveStream', errorMsg);
      stopAction('saveStream');
      throw error;
    }
  }
  // endregion

  // region Tag Operations
  const addTag = (streamId: string, tag: string) => {
    startAction('addTag');
    try {
      if (!store.hasRow('streams', streamId)) {
        const errorMsg = 'Stream not found';
        setLastError('addTag', errorMsg);
        stopAction('addTag');
        return;
      }

      // Store the original tag as the label
      let label = tag.trim();

      // Sanitize the tag for internal use (lowercase, no spaces, only hyphens)
      const sanitizedTag = sanitizeTag(tag);

      // Check if tag already exists in the streamTags table
      let tagExists = false;
      if (store.hasTable('streamTags')) {
        const streamTags = store.getTable('streamTags');
        for (const tagId in streamTags) {
          const tagEntry = streamTags[tagId];
          if (tagEntry.streamId === streamId && (tagEntry.tag as string) === sanitizedTag) {
            tagExists = true;
            label = tagEntry.label as string;
            break;
          }
        }
      }

      if (tagExists) {
        // Tag already exists, no need to add it again
        stopAction('addTag');
        return;
      }

      // Create the streamTags table if it doesn't exist
      if (!store.hasTable('streamTags')) {
        store.setTable('streamTags', {});
      }

      // Generate a new unique ID for the tag
      const newTagId = Date.now().toString();

      // Add the new tag to the streamTags table with both tag and label
      store.setRow('streamTags', newTagId, {
        streamId: streamId,
        tag: sanitizedTag,
        label: label
      });

      stopAction('addTag');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('addTag', errorMsg);
      stopAction('addTag');
      throw error;
    }
  };

  const removeTag = (streamId: string, tag: string) => {
    startAction('removeTag');
    try {
      if (!store.hasRow('streams', streamId)) {
        const errorMsg = 'Stream not found';
        setLastError('removeTag', errorMsg);
        stopAction('removeTag');
        return;
      }

      // Sanitize the tag for comparison with stored tags
      const sanitizedTag = sanitizeTag(tag);

      // Find and remove the tag from the streamTags table
      if (store.hasTable('streamTags')) {
        const streamTags = store.getTable('streamTags');
        for (const tagId in streamTags) {
          const tagEntry = streamTags[tagId];
          if (tagEntry.streamId === streamId && (tagEntry.tag as string) === sanitizedTag) {
            // Remove this tag
            store.delRow('streamTags', tagId);
            break;
          }
        }
      }

      stopAction('removeTag');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('removeTag', errorMsg);
      stopAction('removeTag');
      throw error;
    }
  };
  // endregion

  // region Participant Operations
  const addParticipant = (streamId: string, userId: number, providerName: string, provider: string) => {
    startAction('addParticipant');
    try {
      if (!store.hasRow('streams', streamId)) {
        const errorMsg = 'Stream not found';
        setLastError('addParticipant', errorMsg);
        stopAction('addParticipant');
        return;
      }

      // Check if participant already exists in the streamParticipants table
      let participantExists = false;
      if (store.hasTable('streamParticipants')) {
        const streamParticipants = store.getTable('streamParticipants');
        for (const participantId in streamParticipants) {
          const participantEntry = streamParticipants[participantId];
          if (participantEntry.streamId === streamId && participantEntry.userId === userId) {
            participantExists = true;
            break;
          }
        }
      }

      if (participantExists) {
        // Participant already exists, no need to add it again
        stopAction('addParticipant');
        return;
      }

      // Create the streamParticipants table if it doesn't exist
      if (!store.hasTable('streamParticipants')) {
        store.setTable('streamParticipants', {});
      }

      // Generate a new unique ID for the participant
      const newParticipantId = Date.now().toString();

      // Add the new participant to the streamParticipants table
      store.setRow('streamParticipants', newParticipantId, {
        streamId: streamId,
        userId: userId,
        providerName: providerName,
        provider: provider
      });

      stopAction('addParticipant');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('addParticipant', errorMsg);
      stopAction('addParticipant');
      throw error;
    }
  };

  const removeParticipant = (streamId: string, userId: number) => {
    startAction('removeParticipant');
    try {
      if (!store.hasRow('streams', streamId)) {
        const errorMsg = 'Stream not found';
        setLastError('removeParticipant', errorMsg);
        stopAction('removeParticipant');
        return;
      }

      // Find and remove the participant from the streamParticipants table
      if (store.hasTable('streamParticipants')) {
        const streamParticipants = store.getTable('streamParticipants');
        for (const participantId in streamParticipants) {
          const participantEntry = streamParticipants[participantId];
          if (participantEntry.streamId === streamId && participantEntry.userId === userId) {
            // Remove this participant
            store.delRow('streamParticipants', participantId);
            break;
          }
        }
      }

      stopAction('removeParticipant');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('removeParticipant', errorMsg);
      stopAction('removeParticipant');
      throw error;
    }
  };
  // endregion

  // region Tag API Operations
  // Fetch tags from the server based on the request parameters
  const fetchTags = async (
    request?: {
      searchTag?: string,
      stream: {
        streamId: number, scheduleId: number
      },
      exclude?: string[]
    }) => {
    console.log('fetchTags', request);
    startAction('fetchTags');

    try {
      let data, error;

      // If both stream and searchTag are provided, use getSuggestedTagsForStreamBySearchTerm
      if (request?.stream && request?.searchTag) {
        ({data, error} = await actions.schedules.getSuggestedTagsForStreamBySearchTerm({
          streamId: request.stream.streamId,
          scheduleId: request.stream.scheduleId,
          term: request.searchTag,
          limit: 5
        }));
      }
      // If only stream is provided, use getSuggestedTagsForStream
      else if (request?.stream) {
        ({data, error} = await actions.schedules.getSuggestedTagsForStream({
          streamId: request.stream.streamId,
          scheduleId: request.stream.scheduleId,
          limit: 5
        }));
      }
      // If neither stream nor searchTag is provided, use getPopularTags
      else {
        ({data, error} = await actions.schedules.getPopularTags(5));
      }

      if (error) {
        console.error("Error fetching tags:", error);
        setLastError('fetchTags', error.message || "Error fetching tags");
        stopAction('fetchTags');
        return {tags: [], defaultTags: [], charityTags: []};
      }

      stopAction('fetchTags');
      return data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('fetchTags', errorMsg);
      stopAction('fetchTags');
      return {tags: [], defaultTags: [], charityTags: []};
    }
  };
  // endregion

  // region Schedule API Operations
  const saveSchedule = async () => {
    startAction('saveSchedule');
    try {
      const result = await actions.schedules.save(local.id);
      if (result.error) {
        console.error("Failed to save schedule:", result.error);
        setLastError('saveSchedule', result.error.message);
      }
      stopAction('saveSchedule');
      return result;
    } catch (error) {
      console.error("Error saving schedule:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setLastError('saveSchedule', errorMsg);
      stopAction('saveSchedule');
      throw error;
    }
  };

  const deleteSchedule = async () => {
    startAction('deleteSchedule');
    try {
      const result = await actions.schedules.delete(local.id);
      if (result.error) {
        console.error("Failed to delete schedule:", result.error);
        setLastError('deleteSchedule', result.error.message);
      } else {
        console.log("Schedule deleted successfully!");
      }
      stopAction('deleteSchedule');
      return result;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setLastError('deleteSchedule', errorMsg);
      stopAction('deleteSchedule');
      throw error;
    }
  };
  // endregion


  createEffect(() => {
    console.log('streams', local.streams)
  })

  return {
    id,
    local,
    username,
    addNewStream,
    updateStream,
    deleteStream,
    saveStream,
    updateStreamTitle,
    updateStreamDescription,
    updateStreamSubtitle,
    updateStreamEnd,
    updateStreamStart,
    updateStreamVisibility,
    updateScheduleTitle,
    updateScheduleYear,
    updateScheduleSlug,
    updateScheduleVisibility,
    getStreamsByDay,
    getAllDays,
    addTag,
    removeTag,
    addParticipant,
    removeParticipant,
    fetchTags,
    saveSchedule,
    deleteSchedule,
    // Action state
    action: action
  }
}

interface ScheduleEditorProps {
  id: number
  userId: number
  username: string
}

const ScheduleEditorContext = createContext<ReturnType<typeof useScheduleEditorHook>>();

export const ScheduleEditorProvider: ParentComponent<ScheduleEditorProps> = (props) => {
  const hook = useScheduleEditorHook(props.id, props.userId, props.username);
  return (
    <ScheduleEditorContext.Provider value={hook}>{props.children}</ScheduleEditorContext.Provider>
  );
}
export const useScheduleEditor = () => useContext(ScheduleEditorContext)!
