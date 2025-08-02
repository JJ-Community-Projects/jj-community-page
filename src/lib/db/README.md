# JingleJam Community Page - Database Layer Architecture

## Overview

This document describes the architecture of the database layer for the JingleJam Community Page. The architecture follows a three-layer approach:

```
src/lib/db2/
├── repos/           # Data Access Layer
├── services/        # Business Logic Layer
├── ui/              # UI Presentation Layer
├── types/           # Type Definitions
└── errors/          # Error Classes
```

## Layer Responsibilities

### Data Access Layer (Repos)

The Data Access Layer is responsible for direct database interactions. It provides a clean interface for accessing and manipulating data in the database.

**Key Responsibilities:**
- CRUD operations on specific tables
- Query construction and execution
- Database transaction management
- Data validation at the database level

**Characteristics:**
- Table-focused (one repo per table)
- No business logic
- No UI formatting
- No cross-table complex operations

**Examples:**
- `ScheduleRepo`: Operations on the schedules table
- `StreamRepo`: Operations on the streams table
- `UserRepo`: Operations on the users table
- `TeamRepo`: Operations on the teams table

### Business Logic Layer (Services)

The Business Logic Layer is responsible for implementing domain-specific operations and workflows. It coordinates operations across multiple repositories and enforces business rules.

**Key Responsibilities:**
- Coordinating operations across multiple repositories
- Implementing business rules and validations
- Managing complex workflows
- Handling authorization checks
- Orchestrating batch operations

**Characteristics:**
- Domain-focused (organized around business concepts)
- Depends on repositories but not on UI formatters
- Contains all business logic
- Manages transactions spanning multiple repositories

**Examples:**
- `ScheduleService`: Operations related to schedules and their streams
- `UserService`: Operations related to users and their accounts
- `TeamService`: Operations related to teams and their members

### UI Presentation Layer (UIFormatters)

The UI Presentation Layer is responsible for formatting data for UI consumption. It transforms database entities into UI-friendly structures.

**Key Responsibilities:**
- Transforming database entities into UI-friendly structures
- Handling UI-specific data transformations
- Providing consistent data formats for the frontend
- Implementing view-specific logic

**Characteristics:**
- View-focused (organized around UI needs)
- Pure formatting functions (no database operations)
- No business logic
- Stateless operations

**Examples:**
- `ScheduleUIFormatter`: Formats schedule data for display
- `UserUIFormatter`: Formats user data for display
- `TeamUIFormatter`: Formats team data for display

## Error Handling

The architecture uses a hierarchical error system to provide consistent error handling across all layers.

### Error Types

1. **Base Error Types:**
   - `DatabaseError`: For all database-related errors
   - `ServiceError`: For business logic errors
   - `ValidationError`: For input validation errors
   - `AuthorizationError`: For permission-related errors

2. **Specialized Error Types:**
   - `NotFoundError`: When entities don't exist
   - `DuplicateError`: For unique constraint violations
   - `ReferenceError`: For foreign key violations
   - `ConnectionError`: For database connection issues

### Error Handling by Layer

#### Repository Layer
- Catches and transforms database errors
- Provides context about the failed operation
- Throws appropriate error types based on the error

#### Service Layer
- Performs business logic validation
- Handles or transforms errors from repositories
- Adds context to errors
- Ensures consistent error types

#### UI Formatter Layer
- Handles formatting errors gracefully
- Provides fallback formats for error cases
- Logs formatting errors

## Authorization

Authorization is centralized in the service layer to ensure consistent access control across the application.

### Authorization Responsibilities by Layer

#### Repository Layer
- NO authorization checks
- Repositories focus solely on data access, not business rules

#### Service Layer
- ALL authorization checks
- Early authorization checks at the beginning of service methods
- Role-based, resource-based, and contextual authorization

#### UI Formatter Layer
- NO authorization checks
- UI formatters only format data that has already passed authorization checks

## Data Types

The architecture uses a layered approach to type definitions:

### Type Definition Locations

#### Database Schema Types
- **Location:** `src/lib/db/schema/`
- **Purpose:** Define database tables and relationships
- **Example:** `Schedule` from `schedulesTable`

#### Domain Types
- **Location:** `src/lib/db2/types/`
- **Purpose:** Define business entity types and relationships
- **Example:** `ScheduleWithStreams`, `UserWithAccounts`

#### Input Types
- **Location:** `src/lib/db2/types/`
- **Purpose:** Define input data structures for creating and updating entities
- **Example:** `ScheduleInput`, `TeamUpdateInput`

#### UI Types
- **Location:** `src/lib/db2/ui/types/` (to be implemented)
- **Purpose:** Define formatted data structures for UI consumption
- **Example:** `ScheduleUI`, `UserProfileUI`

## Usage Examples

### Repository Layer Example

```typescript
// Using ScheduleRepo
const scheduleRepo = new ScheduleRepo(env, 'action');
const schedule = await scheduleRepo.findBySlug('jingle-jam-2023');

// Using StreamRepo
const streamRepo = new StreamRepo(env, 'action');
const streams = await streamRepo.findByScheduleId(schedule.id);
```

### Service Layer Example (to be implemented)

```typescript
// Using ScheduleService
const scheduleService = new ScheduleService(env, 'action');
const scheduleWithStreams = await scheduleService.getScheduleWithStreams(scheduleId, userId);

// Creating a schedule with streams
await scheduleService.createScheduleWithStreams({
  title: 'Jingle Jam 2023',
  slug: 'jingle-jam-2023',
  year: 2023,
  visible: true,
  streams: [
    {
      title: 'Opening Stream',
      start: new Date('2023-12-01T18:00:00Z'),
      end: new Date('2023-12-01T22:00:00Z')
    }
  ]
});
```

### UI Formatter Example (to be implemented)

```typescript
// Using ScheduleUIFormatter
const formatter = new ScheduleUIFormatter();
const formattedSchedule = formatter.formatScheduleForDisplay(
  schedule,
  streams,
  owner,
  canEdit
);
```

## Migration Strategy

This architecture is designed to allow for a smooth migration from the existing database layer. The new layer is implemented in a separate directory (`/src/lib/db2`) to avoid conflicts with the existing code.

The migration strategy is as follows:

1. Implement the new architecture in `/src/lib/db2`
2. Create adapters to bridge between the old and new layers if needed
3. Gradually migrate existing code to use the new layer
4. Once all code has been migrated, remove the old layer

## Conclusion

This architecture provides a clear separation of concerns between data access, business logic, and UI presentation. By following these guidelines, the codebase will become more maintainable, testable, and extensible.

The key benefits of this architecture are:
- Improved separation of concerns
- Consistent error handling
- Centralized authorization
- Type safety throughout the application
- Clear interfaces between layers
