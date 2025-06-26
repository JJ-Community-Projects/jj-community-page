/**
 * ScheduleEditorProvider.tsx
 *
 * This file implements the main provider for the Schedule Editor system, which enables
 * real-time collaborative editing of JingleJam schedules. The provider manages:
 *
 * - Synchronization with the server via WebSockets and TinyBase
 * - Local state management for UI rendering
 * - Methods for creating, updating, and deleting streams
 * - Methods for managing tags and participants
 * - Schedule metadata operations
 *
 * The provider uses a dual-state approach:
 * 1. A TinyBase store synchronized with the server for data consistency
 * 2. A local SolidJS store for reactive UI updates
 *
 * Changes made through the provider's methods are automatically synchronized
 * with the server and other connected clients in real-time.
 */

import {createMergeableStore} from "tinybase/mergeable-store";
import {createStore} from "solid-js/store";
import {DateTime} from "luxon";
import {sanitizeTag} from "../../../../../functions/slug.ts";
import {createAction} from "../../../../../functions/createAction.ts";

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
import type {
  HookActions,
  ScheduleType,
  StreamType,
  Tag,
  Participant,
  ValueOrSetter
} from "../../../../../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes";
import {createWsSynchronizer, type WsSynchronizer} from "tinybase/synchronizers/synchronizer-ws-client";
import ReconnectingWebSocket from "reconnecting-websocket";
import {actions} from "astro:actions";
import {useScheduleEditorConnection} from "./ScheduleEditorConnectionProvider.tsx";

/**
 * Defines the structure for tracking the state of all actions in the hook.
 * Each action has:
 * - actionInProgress: Boolean flag indicating if the action is currently executing
 * - lastErrorMessage: Optional string containing the last error message if the action failed
 *
 * This type is used to create a store that tracks loading states and errors
 * for all operations, enabling UI components to show loading indicators and error messages.
 *
 * @see HookActions in ScheduleEditorTypes.ts
 */

/**
 * Initial state for all hook actions.
 * Sets all actions to not in progress and with no error messages.
 */
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
  updateAlwaysAddSelfToStream: {
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

  const {store, addListener} = useScheduleEditorConnection()

  const {
    actions: action,
    startAction,
    stopAction,
    setLastError,
    isActionInProgress,
    getLastErrorMessage
  } = createAction<keyof HookActions>(undefined, Object.keys(initHookState) as (keyof HookActions)[])

  const [local, setLocal] = createStore<ScheduleType>({
    id: id,
    title: '',
    year: new Date().getFullYear(),
    slug: '',
    visible: false,
    streams: [],
    alwaysAddSelfToStream: true
  })


  // region schedule properties
  addListener(
    store.addValueListener(
      'id',
      (_, __, newValue) => {
        console.log('Changing schedule id to', newValue);
        setLocal('id', newValue as number);
      }
    )
  )

  addListener(
    store.addValueListener(
      'alwaysAddSelfToStream',
      (_, __, newValue) => {
        console.log('Changing alwaysAddSelfToStream to', newValue);
        setLocal('alwaysAddSelfToStream', newValue as boolean);
      }
    )
  )

  addListener(
    store.addValueListener(
      'title',
      (_, __, newValue) => {
        console.log('Changing schedule title to', newValue);
        setLocal('title', newValue as string);
      }
    )
  )

  addListener(
    store.addValueListener(
      'visible',
      (_, __, newValue) => {
        console.log('Changing schedule visibility to', newValue);
        setLocal('visible', newValue as boolean);
      }
    )
  )

  addListener(
    store.addValueListener(
      'year',
      (_, __, newValue) => {
        console.log('Changing schedule year to', newValue);
        setLocal('year', newValue as number);
      }
    )
  )

  addListener(
    store.addValueListener(
      'slug',
      (_, __, newValue) => {
        console.log('Changing schedule slug to', newValue);
        setLocal('slug', newValue as string);
      }
    )
  )
  // endregion

  // region streams management
  addListener(
    store.addHasRowListener(
      'streams', null,
      (s, __, rowId, added) => {
        if (added) {
          const value = s.getRow('streams', rowId);
          console.log('Adding stream row', value);
          setLocal('streams', (streams) => streams.concat(rowToLocal(parseInt(rowId), value)).sort((a, b) => a.id - b.id));
        } else {
          console.log('Removing stream row', rowId);
          setLocal('streams', (streams) => {
            return streams.filter((s) => s.id !== parseInt(rowId));
          })
        }
      }
    )
  )

  // region stream properties
  addListener(
    store.addCellListener('streams', null, 'title',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        console.log('Changing stream title to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id === parseInt(rowId)!
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
        console.log('Changing stream visibility to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id == parseInt(rowId)
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
        console.log('Changing stream subtitle to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id == parseInt(rowId)
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
        console.log('Changing stream description to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id == parseInt(rowId)
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
        console.log('Changing stream start time to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id == parseInt(rowId)
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
        console.log('Changing stream end time to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id == parseInt(rowId)
        }, 'end', DateTime.fromISO(value as string, {zone: 'utc'}).toLocal());
      })
  )

  addListener(
    store.addCellListener('streams', null, 'createdBy',
      (s, _, rowId, cellId,
       value) => {
        if (!s.hasRow('streams', rowId)) {
          return
        }
        console.log('Changing stream createdBy to', value, 'for stream', rowId);
        setLocal('streams', (s) => {
          return s.id === parseInt(rowId)
        }, 'createdBy', value as number);
      })
  )
  // endregion

  // region stream tags
  addListener(
    store.addTableListener('streamTags', (s, _, tableId) => {
      // When the streamTags table changes, update all streams' tags in the local state
      console.log('Stream tags table changed');
      const streamTags = s.getTable('streamTags');
      const streams = local.streams;

      // Create a map of streamId to tags
      const tagsByStream: { [streamId: string]: { label: string; tag: string }[] } = {};

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

  addListener(
    store.addHasRowListener(
      'streamTags', null,
      (s, __, rowId, added) => {
        if (added) {
          const value = s.getRow('streamTags', rowId);
          console.log('Adding tag to stream', value);
          const streamId = value.streamId as string;
          const tag = {
            label: value.label as string,
            tag: value.tag as string
          };

          // Add the tag to the appropriate stream's tags array
          setLocal('streams', (stream) => stream.id === parseInt(streamId), 'tags',
            (tags) => [...tags, tag]);
        } else {
          console.log('Removing tag from stream', rowId);
          // Find the stream and tag to remove
          const streamTags = s.getTable('streamTags');
          const streams = local.streams;

          // We need to find which stream this tag belonged to
          // Since the row is already deleted, we need to check all streams
          for (const stream of streams) {
            // Check if any tag in this stream matches the deleted rowId
            const tagIndex = stream.tags.findIndex(t =>
              // We can't directly compare with rowId since it's deleted
              // Instead, we check if this tag doesn't exist in the table anymore
              !Object.values(streamTags).some(st =>
                st.streamId === stream.id && st.tag === t.tag
              )
            );

            if (tagIndex !== -1) {
              // Remove the tag from this stream
              setLocal('streams', (s) => s.id === stream.id, 'tags',
                (tags) => tags.filter((_, i) => i !== tagIndex));
              break;
            }
          }
        }
      }
    )
  )
  // endregion

  // region stream participants
  addListener(
    store.addTableListener('streamParticipants', (s, _, tableId) => {
      // When the streamParticipants table changes, update all streams' participants in the local state
      console.log('Stream participants table changed');
      const streamParticipants = s.getTable('streamParticipants');
      const streams = local.streams;

      // Create a map of streamId to participants
      const participantsByStream: { [streamId: string]: { userId: number; name: string }[] } = {};

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

  addListener(
    store.addHasRowListener(
      'streamParticipants', null,
      (s, __, rowId, added) => {
        if (added) {
          const value = s.getRow('streamParticipants', rowId);
          console.log('Adding participant to stream', value);
          const streamId = value.streamId as string;
          const participant = {
            userId: value.userId as number,
            name: value.providerName as string || 'Unknown'
          };

          // Add the participant to the appropriate stream's participants array
          setLocal('streams', (stream) => stream.id === parseInt(streamId), 'participants',
            (participants) => [...participants, participant]);
        } else {
          console.log('Removing participant from stream', rowId);
          // Find the stream and participant to remove
          const streamParticipants = s.getTable('streamParticipants');
          const streams = local.streams;

          // We need to find which stream this participant belonged to
          // Since the row is already deleted, we need to check all streams
          for (const stream of streams) {
            // Check if any participant in this stream matches the deleted rowId
            const participantIndex = stream.participants.findIndex(p =>
              // We can't directly compare with rowId since it's deleted
              // Instead, we check if this participant doesn't exist in the table anymore
              !Object.values(streamParticipants).some(sp =>
                sp.streamId === stream.id && sp.userId === p.userId
              )
            );

            if (participantIndex !== -1) {
              // Remove the participant from this stream
              setLocal('streams', (s) => s.id === stream.id, 'participants',
                (participants) => participants.filter((_, i) => i !== participantIndex));
              break;
            }
          }
        }
      }
    )
  )
  // endregion

  // endregion

  // region Data Conversion
  const rowToLocal = (id: number, row: Row): StreamType => {
    // Get tags for this stream from the streamTags table
    const tags: Tag[] = [];
    if (store.hasTable('streamTags')) {
      const streamTags = store.getTable('streamTags');
      for (const tagId in streamTags) {
        const tagEntry = streamTags[tagId];
        if (tagEntry.streamId === id) {
          // Use the label for display if available, otherwise use the tag
          tags.push({
            label: tagEntry.label as string, tag: tagEntry.tag as string
          });
        }
      }
    }

    // Get participants for this stream from the streamParticipants table
    const participants: Participant[] = [];
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

  const localToRow = (stream: StreamType): Row => {
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
  const addCustomStream = () => {
    startAction('addNewStream');
    try {
      let startTime: DateTime;
      let endTime: DateTime;

      if (local.streams.length === 0) {
        // If there are no streams, set start time to December 1 of current year at 11:00
        const currentYear = new Date().getFullYear();
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
        const streamValues = Object.values(local.streams);
        const lastStream = streamValues[streamValues.length - 1];

        startTime = lastStream.end;
        // End time is 3 hours later
        endTime = startTime.plus({hours: 3});
      }

      // Add the new stream
      const id = store.addRow('streams', {
        title: 'New stream',
        subtitle: '',
        description: '',
        visible: false,
        start: startTime.setZone('utc').toISO()!,
        end: endTime.setZone('utc').toISO()!,
        createdBy: userId
      });

      if (local.alwaysAddSelfToStream) {
        // Ensure the streamParticipants table exists
        if (!store.hasTable('streamParticipants')) {
          store.setTable('streamParticipants', {});
        }

        // Generate a new unique ID for the participant
        const newParticipantId = Date.now().toString();

        // Add the current user as a participant using the ID returned by addRow
        if (id) {
          store.setRow('streamParticipants', newParticipantId, {
            streamId: id,
            userId: userId,
            providerName: username,
            provider: 'tiltify'
          });
        }
      }

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
  };

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
        const streamsOfTheDay = local.streams.filter((s) => s.start.day === day)
        const lastStream = streamsOfTheDay.length > 0 ? streamsOfTheDay.reduce((a, b) => {
          if (a.start > b.start) {
            return a
          }
          return b
        }) : undefined
        // If a specific day is provided (for the desktop view)
        startTime = lastStream?.end ?? DateTime.fromObject({
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
      const id = store.addRow('streams', {
        title: 'New stream',
        subtitle: '',
        description: '',
        visible: false,
        start: startTime.setZone('utc').toISO()!,
        end: endTime.setZone('utc').toISO()!,
        createdBy: userId,
      });

      if (local.alwaysAddSelfToStream) {
        // Ensure the streamParticipants table exists
        if (!store.hasTable('streamParticipants')) {
          store.setTable('streamParticipants', {});
        }

        // Generate a new unique ID for the participant
        const newParticipantId = Date.now().toString();

        const user = {
          streamId: id,
          userId: userId,
          providerName: username,
          provider: 'tiltify'
        }

        if (id) {
          // Add the current user as a participant using the ID returned by addRow
          store.setRow('streamParticipants', newParticipantId, {
            streamId: id,
            userId: userId,
            providerName: username,
            provider: 'tiltify'
          });
        }
      }

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

  const updateStream = (stream: StreamType) => {
    startAction('updateStream');
    try {
      console.log('updateStream', stream);
      setLocal('streams', (s) => s.id === stream.id, stream);
      store.setRow('streams', `${id}`, localToRow(stream));
      stopAction('updateStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateStream', errorMsg);
      stopAction('updateStream');
      throw error;
    }
  }

  const deleteStream = (id: number) => {
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
      store.delRow('streams', `${id}`);
      stopAction('deleteStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('deleteStream', errorMsg);
      stopAction('deleteStream');
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

  const updateAlwaysAddSelfToStream = (alwaysAdd: boolean) => {
    startAction('updateAlwaysAddSelfToStream');
    try {
      store.setValue('alwaysAddSelfToStream', alwaysAdd);
      stopAction('updateAlwaysAddSelfToStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateAlwaysAddSelfToStream', errorMsg);
      stopAction('updateAlwaysAddSelfToStream');
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
      days.push(DateTime.fromObject({year: local.year, month: 12, day: day}, {
        zone: 'Europe/London',
      }).toLocal());
    }
    return days;
  };

  const saveStream = (stream: StreamType) => {
    startAction('saveStream');
    console.log('saveStream', stream);
    const id = `${stream.id}`
    try {
      if (!store.hasRow('streams', id)) {
        const errorMsg = 'Stream not found';
        console.log('saveStream', 'stream not found', stream);
        setLastError('saveStream', errorMsg);
        stopAction('saveStream');
        return;
      }

      // Update stream properties
      store.setRow('streams', id, {
        id: stream.id,
        title: stream.title,
        subtitle: stream.subtitle,
        description: stream.description,
        visible: stream.visible,
        start: stream.start.toUTC().toISO()!,
        end: stream.end.toUTC().toISO()!,
        createdBy: stream.createdBy
      });

      // Handle tags
      // First, remove all existing tags for this stream
      if (store.hasTable('streamTags')) {
        const streamTags = store.getTable('streamTags');
        for (const tagId in streamTags) {
          const tagEntry = streamTags[tagId];
          if (tagEntry.streamId === stream.id) {
            store.delRow('streamTags', tagId);
          }
        }
      } else {
        // Create the streamTags table if it doesn't exist
        store.setTable('streamTags', {});
      }

      // Add new tags
      for (const tagItem of stream.tags) {
        const sanitizedTag = sanitizeTag(tagItem.tag);
        const newTagId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        store.setRow('streamTags', newTagId, {
          streamId: stream.id,
          tag: sanitizedTag,
          label: tagItem.label || tagItem.tag
        });
      }

      // Handle participants
      // First, remove all existing participants for this stream
      if (store.hasTable('streamParticipants')) {
        const streamParticipants = store.getTable('streamParticipants');
        for (const participantId in streamParticipants) {
          const participantEntry = streamParticipants[participantId];
          if (participantEntry.streamId === stream.id) {
            store.delRow('streamParticipants', participantId);
          }
        }
      } else {
        // Create the streamParticipants table if it doesn't exist
        store.setTable('streamParticipants', {});
      }

      // Add new participants
      for (const participant of stream.participants) {
        const newParticipantId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        store.setRow('streamParticipants', newParticipantId, {
          streamId: stream.id,
          userId: participant.userId,
          providerName: participant.name,
          provider: participant.provider ?? 'UNKNOWN',
        });
      }

      stopAction('saveStream');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('saveStream', errorMsg);
      stopAction('saveStream');
      throw error;
    }
  }
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

  return {
    id,
    local,
    username,
    addNewStream,
    addCustomStream,
    updateStream,
    deleteStream,
    saveStream,
    updateScheduleTitle,
    updateScheduleYear,
    updateScheduleSlug,
    updateScheduleVisibility,
    updateAlwaysAddSelfToStream,
    getStreamsByDay,
    getAllDays,
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
