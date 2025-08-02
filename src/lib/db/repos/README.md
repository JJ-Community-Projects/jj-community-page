# New Repository Structure

This directory contains a new implementation of the repository pattern for the JingleJam Community Page. The new structure follows a domain-driven design approach with a clear separation of concerns.

## Architecture Overview

The new repository structure is organized as follows:

```
/newRepos
  /base
    BaseRepo.ts       - Base class for all domain repositories
    BaseSection.ts    - Base class for all table-specific sections
  /schedule           - Schedule domain
    ScheduleRepo.ts   - Repository for schedule domain operations
    /sections
      ScheduleSection.ts          - Section for schedule table operations
      StreamSection.ts            - Section for stream table operations
      StreamTagSection.ts         - Section for stream tag table operations
      StreamParticipantSection.ts - Section for stream participant table operations
      EditorSection.ts            - Section for editor table operations
```

## Key Concepts

### Sections

Sections are responsible for CRUD operations on a single table. They provide:

- Basic CRUD operations (findById, findAll, create, update, delete)
- Additional finder methods specific to the table
- Utility methods for table-specific operations
- Batch operation methods for efficient bulk operations

Sections extend the `BaseSection` class, which provides common functionality and error handling.

### Repositories

Repositories coordinate operations across multiple tables within a domain. They provide:

- Access to all sections through getter methods
- Complex operations that span multiple tables
- Business logic specific to the domain

Repositories extend the `BaseRepo` class, which provides common functionality and error handling.

## Usage Examples

### Basic CRUD Operations

```typescript
// Create a repository instance
const scheduleRepo = new ScheduleRepo(env, 'api');

// Get a section
const scheduleSection = scheduleRepo.getScheduleSection();

// Find a schedule by ID
const schedule = await scheduleSection.findById(1);

// Create a new schedule
const newSchedule = await scheduleSection.create({
  title: 'New Schedule',
  slug: 'new-schedule',
  year: 2025,
  visible: true,
  primary: false,
  ownerId: 1
});

// Update a schedule
const updatedSchedule = await scheduleSection.update(1, {
  title: 'Updated Schedule'
});

// Delete a schedule
await scheduleSection.delete(1);
```

### Complex Operations

```typescript
// Create a schedule with streams, tags, and participants
const schedule = await scheduleRepo.createScheduleWithStreams(
  {
    title: 'Test Schedule',
    slug: 'test-schedule',
    year: 2025,
    visible: true,
    primary: false,
    ownerId: 1
  },
  [
    {
      stream: {
        title: 'Test Stream 1',
        subtitle: 'First test stream',
        description: 'This is a test stream',
        start: new Date('2025-12-01T12:00:00Z'),
        end: new Date('2025-12-01T14:00:00Z'),
        visible: true,
        createdBy: 1
      },
      tags: [
        { tag: 'test', label: 'Test' },
        { tag: 'example', label: 'Example' }
      ],
      participants: [
        { userId: 1 }
      ]
    }
  ]
);

// Find a schedule with detailed streams
const scheduleWithStreams = await scheduleRepo.findScheduleWithDetailedStreams(1);

// Update a schedule with streams, tags, and participants
const updatedSchedule = await scheduleRepo.updateScheduleWithStreams(1, {
  title: 'Updated Schedule',
  streams: {
    creates: [
      {
        title: 'New Stream',
        start: new Date(),
        end: new Date(),
        createdBy: 1
      }
    ],
    updates: [
      {
        id: 1,
        title: 'Updated Stream'
      }
    ],
    deletes: [2]
  },
  tags: {
    creates: [
      { streamId: 1, tag: 'new-tag', label: 'New Tag' }
    ],
    deletes: [
      { streamId: 1, tag: 'old-tag' }
    ]
  },
  participants: {
    creates: [
      { streamId: 1, userId: 2 }
    ],
    deletes: [
      { streamId: 1, userId: 3 }
    ]
  }
});

// Delete a schedule and all its related data
await scheduleRepo.deleteScheduleWithStreams(1);
```

### Editor Management

```typescript
// Add an editor to a schedule
await scheduleRepo.addEditor(1, 2);

// Check if a user can edit a schedule
const canEdit = await scheduleRepo.canEditSchedule(1, 2);

// Remove an editor from a schedule
await scheduleRepo.removeEditor(1, 2);
```

## Benefits of the New Structure

1. **Clear Separation of Concerns**: Each section is responsible for a single table, and each repository is responsible for a single domain.

2. **Improved Maintainability**: The code is more modular and easier to understand, with clear boundaries between different parts of the system.

3. **Better Testability**: Sections and repositories can be tested in isolation, making it easier to write unit tests.

4. **Reduced Duplication**: Common functionality is extracted into base classes, reducing code duplication.

5. **Type Safety**: All operations are strongly typed, providing better type safety and developer experience.

## Migration Strategy

To migrate from the old repository structure to the new one:

1. Create new repositories and sections for each domain
2. Update consumers to use the new repositories
3. Remove the old repositories once all consumers have been updated

The new repositories can coexist with the old ones during the migration period, allowing for a gradual transition.

## Future Work

1. Implement repositories for other domains (teams, users, etc.)
2. Add more comprehensive tests
3. Add transaction support for operations that span multiple tables
4. Improve error handling and validation
