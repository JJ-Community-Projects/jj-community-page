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

import {createStore} from "solid-js/store";
import {DateTime} from "luxon";
import {sanitizeTag} from "../../../../../functions/slug.ts";
import {createAction} from "../../../../../functions/createAction.ts";

import {createContext, type ParentComponent, useContext} from "solid-js";

import type {Row} from "tinybase/store";
import type {
  HookActions,
  Participant,
  ScheduleType,
  StreamType,
  Tag
} from "../../../../../lib/model/admin/user/scheduleEditor/ScheduleEditorTypes";
import {useScheduleEditorConnection} from "./ScheduleEditorConnectionProvider.tsx";
import {useMutation, useQueryClient} from "@tanstack/solid-query";
import {orpc} from "../../../../../lib/orpc/client.ts";

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
  updateDefaultStreamVisibility: {
    actionInProgress: false,
  },
  updateDefaultStreamLength: {
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
  const queryClient = useQueryClient()
  const schedules = orpc.private.schedules
  const tags = orpc.private.tags

  // Schedule mutations
  const saveScheduleMutation = useMutation(() =>
    schedules.save.mutationOptions({
      onSuccess: async () => {
        // Invalidate related queries if needed
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  const deleteScheduleMutation = useMutation(() =>
    schedules.delete.mutationOptions({
      onSuccess: async () => {
        // Invalidate related queries
        await queryClient.invalidateQueries({queryKey: schedules.getSchedules.queryKey()});
      },
    })
  );

  // Tag mutations
  const searchTagsMutation = useMutation(() =>
    tags.searchTags.mutationOptions()
  );

  const getPopularTagsMutation = useMutation(() =>
    tags.getPopularTags.mutationOptions()
  );

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
    alwaysAddSelfToStream: true,
    defaultStreamVisibility: false,
    defaultStreamLength: 180,
    streams: [],
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
      'defaultStreamVisibility',
      (_, __, newValue) => {
        console.log('Changing defaultStreamVisibility to', newValue);
        setLocal('defaultStreamVisibility', newValue as boolean);
      }
    )
  )
  addListener(
    store.addValueListener(
      'defaultStreamLength',
      (_, __, newValue) => {
        console.log('Changing defaultStreamLength to', newValue);
        setLocal('defaultStreamLength', newValue as number);
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
        endTime = startTime.plus({minute: local.defaultStreamLength});
      } else {
        // If there are streams, set start time to the end time of the last stream
        const streamValues = Object.values(local.streams);
        const lastStream = streamValues[streamValues.length - 1];

        startTime = lastStream.end;
        // End time is 3 hours later
        endTime = startTime.plus({minute: local.defaultStreamLength});
      }

      // Add the new stream
      const id = store.addRow('streams', {
        title: 'New stream',
        subtitle: '',
        description: '',
        visible: local.defaultStreamVisibility,
        start: startTime.setZone('utc').toISO()!,
        end: endTime.setZone('utc').toISO()!,
        createdBy: userId
      });

      if (local.alwaysAddSelfToStream) {
        // Ensure the streamParticipants table exists
        if (!store.hasTable('streamParticipants')) {
          store.setTable('streamParticipants', {});
        }

        // Check if the user is already a participant in this stream
        let userAlreadyAdded = false;
        if (store.hasTable('streamParticipants')) {
          const streamParticipants = store.getTable('streamParticipants');
          for (const participantId in streamParticipants) {
            const participantEntry = streamParticipants[participantId];
            if (participantEntry.streamId === id && participantEntry.userId === userId) {
              userAlreadyAdded = true;
              console.log('User is already a participant in this stream:', username, 'with userId:', userId);
              break;
            }
          }
        }

        // Only add the user if they're not already a participant
        if (!userAlreadyAdded && id) {
          // Generate a new unique ID for the participant
          const newParticipantId = Date.now().toString();

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
        endTime = startTime.plus({minute: local.defaultStreamLength});
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
        endTime = startTime.plus({minute: local.defaultStreamLength});
      } else {
        // If there are streams, set start time to the end time of the last stream
        const lastStream = local.streams[local.streams.length - 1];

        startTime = lastStream.end;
        // End time is 3 hours later
        endTime = startTime.plus({minute: local.defaultStreamLength});

        // Ensure the times are within the allowed range
        if (startTime < startOfRange) {
          startTime = startOfRange;
          endTime = startTime.plus({minute: local.defaultStreamLength});
        }

        if (endTime > endOfRange) {
          endTime = endOfRange;
          // If adjusting end time would make start time before end time, adjust start time too
          if (endTime.diff(startTime, 'hours').hours < 0) {
            startTime = endTime.minus({minute: local.defaultStreamLength});
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
        visible: local.defaultStreamVisibility,
        start: startTime.setZone('utc').toISO()!,
        end: endTime.setZone('utc').toISO()!,
        createdBy: userId,
      });

      if (local.alwaysAddSelfToStream) {
        // Ensure the streamParticipants table exists
        if (!store.hasTable('streamParticipants')) {
          store.setTable('streamParticipants', {});
        }

        // Check if the user is already a participant in this stream
        let userAlreadyAdded = false;
        if (store.hasTable('streamParticipants')) {
          const streamParticipants = store.getTable('streamParticipants');
          for (const participantId in streamParticipants) {
            const participantEntry = streamParticipants[participantId];
            if (participantEntry.streamId === id && participantEntry.userId === userId) {
              userAlreadyAdded = true;
              console.log('User is already a participant in this stream:', username, 'with userId:', userId);
              break;
            }
          }
        }

        // Only add the user if they're not already a participant
        if (!userAlreadyAdded && id) {
          // Generate a new unique ID for the participant
          const newParticipantId = Date.now().toString();

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

  const updateDefaultStreamVisibility = (visible: boolean) => {
    startAction('updateDefaultStreamVisibility');
    try {
      store.setValue('defaultStreamVisibility', visible);
      stopAction('updateDefaultStreamVisibility');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateDefaultStreamVisibility', errorMsg);
      stopAction('updateDefaultStreamVisibility');
      throw error;
    }
  }

  const updateDefaultStreamLength = (length: number) => {
    startAction('updateDefaultStreamLength');
    try {
      store.setValue('defaultStreamLength', length);
      stopAction('updateDefaultStreamLength');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setLastError('updateDefaultStreamLength', errorMsg);
      stopAction('updateDefaultStreamLength');
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


  const hideStream = (id: number) => {
    store.setCell('streams', `${id}`, 'visible', false)
  }

  const showStream = (id: number) => {
    store.setCell('streams', `${id}`, 'visible', true)
  }

  const hideStreams = (ids: number[]) => {
    for (let id of ids) {
      hideStream(id);
    }
  }

  const showStreams = (ids: number[]) => {
    for (let id of ids) {
      showStream(id);
    }
  }

  const deleteStreams = (ids: number[]) => {
    for (let id of ids) {
      deleteStream(id);
    }
  }

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
      // Create a set to track unique tags
      const uniqueTags = new Set<string>();

      for (const tagItem of stream.tags) {
        const sanitizedTag = sanitizeTag(tagItem.tag);

        // Skip if this tag is already added (check by tag value)
        if (uniqueTags.has(sanitizedTag)) {
          console.log('Skipping duplicate tag:', sanitizedTag);
          continue;
        }

        // Add to our set of unique tags
        uniqueTags.add(sanitizedTag);

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
      // Create a set to track unique participants by userId
      const uniqueParticipants = new Set<number>();

      for (const participant of stream.participants) {
        // Skip if this participant is already added (check by userId)
        if (uniqueParticipants.has(participant.userId)) {
          console.log('Skipping duplicate participant:', participant.name, 'with userId:', participant.userId);
          continue;
        }

        // Add to our set of unique participants
        uniqueParticipants.add(participant.userId);

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
      let data;

      // If both stream and searchTag are provided, use searchTags as fallback
      if (request?.stream && request?.searchTag) {
        data = await searchTagsMutation.mutateAsync({
          query: request.searchTag,
          limit: 5
        });
      }
      // If only stream is provided, use searchTags with empty query to get suggestions
      else if (request?.stream) {
        data = await searchTagsMutation.mutateAsync({
          query: '',
          limit: 5
        });
      }
      // If neither stream nor searchTag is provided, use getPopularTags
      else {
        const result = await getPopularTagsMutation.mutateAsync({limit:5});
        data = result.tags
      }

      stopAction('fetchTags');
      // Transform the data to match expected format
      return {
        tags: data || [],
        defaultTags: [],
        charityTags: []
      };
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
    try {
      const result = await saveScheduleMutation.mutateAsync(local.id);
      return { data: result };
    } catch (error) {
      console.error("Error saving schedule:", error);
      throw error;
    }
  };

  const deleteSchedule = async () => {
    try {
      const result = await deleteScheduleMutation.mutateAsync(local.id);
      console.log("Schedule deleted successfully!");
      return { data: result };
    } catch (error) {
      console.error("Error deleting schedule:", error);
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
    updateDefaultStreamVisibility,
    updateDefaultStreamLength,
    getStreamsByDay,
    getAllDays,
    fetchTags,
    saveSchedule,
    saveScheduleMutation,
    deleteSchedule,
    deleteScheduleMutation,
    hideStreams,
    showStreams,
    deleteStreams,
    // Tag mutations
    searchTagsMutation,
    getPopularTagsMutation,
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
