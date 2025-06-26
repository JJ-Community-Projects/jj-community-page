# Schedule Editor System Documentation

## Overview

The Schedule Editor is a real-time collaborative editing system for managing JingleJam schedules. It allows administrators to create, edit, and manage streams within a schedule, including their details, tags, and participants. The system uses a client-server architecture with real-time synchronization to enable multiple users to edit the same schedule simultaneously.

## Key Components

### 1. ScheduleEditorProvider

The `ScheduleEditorProvider` is the main client-side provider that manages the state of the schedule editor and provides an API for components to interact with the schedule data. It handles:

- Loading and synchronizing schedule data with the server
- Managing local state for UI rendering
- Providing methods for creating, updating, and deleting streams
- Managing tags and participants for streams
- Saving changes to the server

### 2. ScheduleEditorStreamEditDialogBodyProvider

The `ScheduleEditorStreamEditDialogBodyProvider` is a specialized provider for editing a single stream in a dialog. It:

- Manages the state of a stream being edited
- Provides methods for updating stream properties
- Handles adding and removing tags and participants
- Saves changes back to the main schedule editor when editing is complete

### 3. ScheduleEditorDO (Durable Object)

The `ScheduleEditorDO` is a server-side Durable Object that:

- Maintains the authoritative state of the schedule
- Handles WebSocket connections for real-time synchronization
- Loads data from the database into a TinyBase store
- Synchronizes changes between clients
- Persists changes back to the database

## State Management

The system uses a multi-layered approach to state management:

### Server-Side State (ScheduleEditorDO)

- Uses TinyBase's MergeableStore for conflict-free state management
- Maintains tables for streams, tags, and participants
- Synchronizes with the database using repository classes
- Handles WebSocket connections for real-time updates

### Client-Side State (ScheduleEditorProvider)

- Uses TinyBase's client-side store synchronized with the server via WebSocket
- Maintains a local SolidJS store for UI rendering
- Sets up listeners to update the local store when the TinyBase store changes
- Provides methods that update the TinyBase store, which then synchronizes with the server

### Dialog State (ScheduleEditorStreamEditDialogBodyProvider)

- Uses a local SolidJS store for the stream being edited
- Changes are only applied to the main schedule when explicitly saved
- Provides a focused API for editing a single stream

## Synchronization with the Server

### WebSocket Connection

1. When the `ScheduleEditorProvider` is mounted, it establishes a WebSocket connection to the server.
2. The connection is made to a specific endpoint for the schedule being edited: `/api/ws/schedules/${id}/editor`.
3. The server routes this connection to the appropriate `ScheduleEditorDO` instance.
4. TinyBase's synchronization mechanism keeps the client and server stores in sync.

### Data Flow

1. **Initial Load**:
   - The `ScheduleEditorDO` loads data from the database into its TinyBase store.
   - When a client connects, the entire store is synchronized to the client.
   - The client sets up listeners to update its local state when the store changes.

2. **Client Updates**:
   - When a user makes changes (e.g., adds a stream, updates a title), the client calls methods on the `ScheduleEditorProvider`.
   - These methods update the TinyBase store.
   - TinyBase automatically synchronizes these changes to the server via WebSocket.
   - The server's TinyBase store is updated.
   - Other connected clients receive these updates and update their local state.

3. **Saving to Database**:
   - When the user explicitly saves the schedule, the client calls the `saveSchedule` method.
   - This triggers an action that calls the server to save the current state to the database.
   - The server's `ScheduleEditorDO` compares its TinyBase store with the database.
   - It determines what needs to be created, updated, or deleted.
   - It performs these operations in a single batch to ensure consistency.

### Conflict Resolution

- TinyBase's MergeableStore handles conflict resolution automatically.
- Changes are applied in a deterministic order, ensuring all clients converge to the same state.
- The server's store is considered authoritative.

## How the Providers Interact

1. **ScheduleEditorProvider and ScheduleEditorDO**:
   - The provider connects to the DO via WebSocket.
   - TinyBase handles synchronization between them.
   - The provider calls actions to trigger explicit save operations.

2. **ScheduleEditorProvider and ScheduleEditorStreamEditDialogBodyProvider**:
   - The dialog provider uses the `useScheduleEditor` hook to access the main provider.
   - It gets the current stream data from the main provider.
   - When editing is complete, it calls the `saveStream` method on the main provider.

## Usage Examples

### Creating a New Stream

```tsx
const { addNewStream } = useScheduleEditor();

// Add a new stream on day 5
addNewStream(5);
```

### Editing a Stream

```tsx
const { stream, setTitle, setDescription, save } = useStreamEditor();

// Update stream properties
setTitle("New Title");
setDescription("New description");

// Save changes
save();
```

### Adding Tags and Participants

```tsx
const { addTag, addParticipant } = useStreamEditor();

// Add a tag
addTag({ tag: "charity", label: "Charity" });

// Add a participant
addParticipant({ 
  userId: 123, 
  name: "JohnDoe", 
  provider: "twitch" 
});
```

### Saving the Schedule

```tsx
const { saveSchedule } = useScheduleEditor();

// Save all changes to the database
await saveSchedule();
```

## Technical Implementation Details

### TinyBase Store Structure

The TinyBase store has the following structure:

1. **Values**:
   - `id`: The schedule ID
   - `title`: The schedule title
   - `slug`: The schedule slug
   - `year`: The schedule year
   - `visible`: Whether the schedule is visible

2. **Tables**:
   - `streams`: Maps stream IDs to stream properties
   - `streamTags`: Maps tag IDs to tag properties
   - `streamParticipants`: Maps participant IDs to participant properties

### Database Synchronization

The `saveToDB` method in `ScheduleEditorDO` handles synchronization with the database:

1. It updates the schedule information.
2. It compares streams in the store with streams in the database:
   - Streams in the store but not in the database are created.
   - Streams in both are updated.
   - Streams in the database but not in the store are deleted.
3. It does the same for tags and participants.
4. All changes are applied in a single batch operation.

## Best Practices

1. **Use the Provided Methods**:
   - Always use the methods provided by the hooks rather than modifying state directly.
   - This ensures proper synchronization with the server.

2. **Handle Errors**:
   - Check the `action` state to handle errors and loading states.
   - Example: `if (action.saveSchedule.actionInProgress) { /* Show loading */ }`

3. **Cleanup**:
   - The providers handle cleanup automatically when unmounted.
   - This includes removing listeners and closing WebSocket connections.

4. **Batch Operations**:
   - When making multiple changes, consider using a single `saveStream` call rather than individual property updates.
   - This reduces the number of synchronization operations.
