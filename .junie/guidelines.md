# Project Guidelines

## Overview

This document provides guidelines for working with the JingleJam Community Page project, which is built using modern web
technologies including TypeScript, Cloudflare D1, Drizzle ORM, Cloudflare Durable Objects, better-auth, and SolidJS.

## Technology Stack

### TypeScript

- All code should be written in TypeScript to ensure type safety and better developer experience.
- Maintain strict typing throughout the codebase.
- Use interfaces and types to define data structures.
- Follow the existing project structure for type definitions.

### Cloudflare D1

- The project uses Cloudflare D1 as its database solution.
- Database configuration is managed through `wrangler.jsonc`.
- The database is bound to the application as `DB`.
- Local development uses a local D1 database that can be migrated using the `local:d1` script.
- Production database is configured with the ID `7385a91b-14db-4254-8906-edf20d6bb68c`.

### Drizzle ORM

- Drizzle ORM is used for database interactions.
- Schema definitions are located in `src/lib/db/schema/`.
- Use the existing schema structure as a reference when adding new tables or modifying existing ones.
- Database migrations are managed using Drizzle Kit:
    - Generate migrations: `npm run generate`
    - Apply migrations: `npm run migrate`
    - Local migrations: `npm run local:d1`
- Follow the existing pattern for defining tables using `sqliteTable`.
- Use the appropriate column types and constraints.

#### Drizzle Database Operations

Drizzle ORM provides a type-safe query builder for interacting with the database. Here's how to perform common operations:

##### Initializing the Database Connection

```typescript
import { drizzle } from "drizzle-orm/d1";
import {getDB} from "../lib/db/db.ts";

// In actions
const db = getDB(ctx);

// In Durable Objects
const db = drizzle(this.env.DB);
```

##### Querying Data

To select data from the database:

```typescript
// Get a single record
const user = await db.select()
  .from(usersTable)
  .where(eq(usersTable.id, userId))
  .get();

// Get multiple records
const teams = await db.select()
  .from(teamsTable)
  .where(eq(teamsTable.ownerId, userId))
  .all();

// Select specific columns
const userNames = await db.select({ 
    id: usersTable.id, 
    name: usersTable.name 
  })
  .from(usersTable)
  .all();

// Join tables
const schedules = await db
  .select()
  .from(schedulesTable)
  .innerJoin(editorsTable, eq(schedulesTable.id, editorsTable.scheduleId))
  .where(eq(editorsTable.userId, userId))
  .all();
```

##### Inserting Data

To insert data into the database:

```typescript
// Insert a single record
const [newUser] = await db.insert(usersTable)
  .values({
    name: "John Doe",
    email: "john@example.com",
    role: "user"
  })
  .returning();

// Insert without returning
await db.insert(logsTable)
  .values({
    message: "User logged in",
    userId: user.id,
    timestamp: new Date()
  })
  .run();
```

##### Updating Data

To update data in the database:

```typescript
// Update a record and return the updated data
const [updatedTeam] = await db.update(teamsTable)
  .set({
    name: "New Team Name",
    slug: "new-team-slug"
  })
  .where(eq(teamsTable.id, teamId))
  .returning();

// Update without returning
await db.update(schedulesTable)
  .set({
    visible: true,
    updatedAt: new Date()
  })
  .where(eq(schedulesTable.id, scheduleId))
  .run();
```

##### Deleting Data

To delete data from the database:

```typescript
// Delete a record
await db.delete(teamsTable)
  .where(eq(teamsTable.id, teamId))
  .run();
```

##### Using Complex Where Conditions

**Important**: Where clauses cannot be chained in Drizzle. Instead, use the `and` utility to combine multiple conditions:

```typescript
import { and, eq, not, like } from "drizzle-orm";

// Using 'and' to combine multiple conditions
const schedule = await db.select()
  .from(schedulesTable)
  .where(
    and(
      eq(schedulesTable.ownerId, userId),
      eq(schedulesTable.year, currentYear)
    )
  )
  .get();

// Using 'not' to negate a condition
const otherSchedules = await db.select()
  .from(schedulesTable)
  .where(
    and(
      eq(schedulesTable.slug, slug),
      not(eq(schedulesTable.id, id))
    )
  )
  .all();

// Using 'like' for pattern matching
const searchResults = await db.select()
  .from(usersTable)
  .where(like(usersTable.name, `%${searchTerm}%`))
  .all();
```

##### Batch Operations

For multiple operations that should be executed together:

```typescript
const batch = [
  db.update(schedulesTable).set({
    title: "Updated Title",
    updatedAt: new Date()
  }).where(eq(schedulesTable.id, scheduleId)),

  db.insert(streamsTable).values({
    scheduleId: scheduleId,
    title: "New Stream",
    start: new Date(),
    end: new Date(Date.now() + 3600000)
  }),

  db.delete(streamsTable)
    .where(
      and(
        eq(streamsTable.id, streamId),
        eq(streamsTable.scheduleId, scheduleId)
      )
    )
];

// Execute the batch
const [firstBatchItem, ...restBatchItems] = batch;
await db.batch([firstBatchItem, ...restBatchItems] as const);
```

### Cloudflare Durable Objects

- Durable Objects are used for stateful operations and WebSocket connections.
- Current Durable Objects:
    - `ScheduleEditorDO`: Manages schedule editing with real-time collaboration.
    - `UserDO`: Handles user-specific stateful operations.
- When creating new Durable Objects:
    1. Define the class in `src/do/`.
    2. Register it in `wrangler.jsonc` under the `durable_objects.bindings` section.
    3. Follow the pattern of extending `DurableObject` or appropriate base classes.
- Use Durable Objects for:
    - Stateful operations that need persistence.
    - Real-time collaboration features.
    - WebSocket connections that require state management.

### Authentication

- Auth database schema is defined in `src/lib/db/schema/auth-schema.ts`.

### Tailwind CSS

- Tailwind CSS should be the preferred way to define styles.
- Use utility classes directly in the HTML/JSX for styling components.
- Follow the utility-first approach to maintain consistency.
- For complex components, consider using Tailwind's composition patterns.
- Avoid custom CSS files when possible, prefer extending Tailwind's configuration.

### SolidJS

- The frontend is built using SolidJS for reactive UI components.
- Component files are located in `src/components/`.
- Custom hooks are in `src/lib/`.
- When creating components:
    - Use TypeScript for type safety.
    - Follow the functional component pattern with props interfaces.
    - Use SolidJS primitives (`createSignal`, `createEffect`, `createStore`, etc.) for reactivity.
    - Keep components focused on a single responsibility.
    - Use custom hooks for reusable logic.
    - When creating dialogs, use the `createModalSignal` utility for managing dialog state.
    - For rendering lists, use `<For>` or `<Index>` components instead of `.map()`.
    - For conditional UI, use `<Show>` component instead of `&&` or ternary operators.
    - For state-dependent UI switching, use `<Switch>` and `<Match>` components.

#### SolidJS Control Flow Components

1. **List Rendering**:
   - Use `<For>` when you have an array of items and need the index:
     ```tsx
     import {For} from "solid-js";

     <For each={items()}>
       {(item, index) => (
         <div>
           {index() + 1}: {item.name}
         </div>
       )}
     </For>
     ```

   - Use `<Index>` when you have an array of primitive values or need stable components:
     ```tsx
     import {Index} from "solid-js";

     <Index each={items()}>
       {(item, index) => (
         <div>
           {index}: {item()}
         </div>
       )}
     </Index>
     ```

2. **Conditional Rendering**:
   - Use `<Show>` instead of `&&` or ternary operators:
     ```tsx
     import {Show} from "solid-js";

     {/* Instead of this */}
     {isVisible() && <div>Content</div>}

     {/* Use this */}
     <Show when={isVisible()}>
       <div>Content</div>
     </Show>

     {/* Instead of ternary */}
     {isVisible() ? <div>Visible</div> : <div>Hidden</div>}

     {/* Use this */}
     <Show when={isVisible()} fallback={<div>Hidden</div>}>
       <div>Visible</div>
     </Show>
     ```

3. **State-Dependent UI Switching**:
   - Use `<Switch>` and `<Match>` for multiple conditional branches:
     ```tsx
     import {Switch, Match} from "solid-js";

     <Switch fallback={<div>Loading...</div>}>
       <Match when={error()}>
         <div>Error: {error().message}</div>
       </Match>
       <Match when={data()}>
         <div>Data: {data().name}</div>
       </Match>
     </Switch>
     ```

These control flow components help maintain reactivity and improve performance by minimizing unnecessary re-renders.

#### SolidJS Kobalt Components

1. **TextField Example**:
   ```tsx
   import { createSignal } from "solid-js";
   import { TextField } from "@kobalte/core/text-field";

   function TextFieldExample() {
     const [value, setValue] = createSignal("Orange");
     return (
       <TextField 
         value={value()}
         onChange={setValue}
         validationState={value() !== "Apple" ? "invalid" : "valid"}
       >
         <TextField.Label>Favorite fruit</TextField.Label>
         <TextField.Input />
         <TextField.ErrorMessage>
           Hmm, I prefer apples.
         </TextField.ErrorMessage>
       </TextField>
     );
   }
   ```

2. **Checkbox Example**:
   ```tsx
   import { createSignal } from "solid-js";
   import { Checkbox } from "@kobalte/core/checkbox";
   // Import the CheckIcon component from your icon library
   import { CheckIcon } from "your-icon-library";

   function CheckboxExample() {
     const [checked, setChecked] = createSignal(false);
     return (
       <Checkbox
         checked={checked()}
         onChange={setChecked}
         validationState={!checked() ? "invalid" : "valid"}
       >
         <Checkbox.Input />
         <Checkbox.Control>
           <Checkbox.Indicator>
             <CheckIcon />
           </Checkbox.Indicator>
         </Checkbox.Control>
         <Checkbox.Label>Agree</Checkbox.Label>
         <Checkbox.ErrorMessage>
           You must agree to our Terms and Conditions.
         </Checkbox.ErrorMessage>
       </Checkbox>
     );
   }
   ```

3. **Dialog with createModalSignal Example**:
   ```tsx
   import { Dialog } from "@kobalte/core/dialog";
   import { createModalSignal } from "../lib/createModalSignal";

   function DialogExample() {
     // Create a modal signal for managing dialog state
     const modal = createModalSignal();

     return (
       <>
         {/* Button to open the dialog */}
         <button 
           onClick={modal.open}
           class="px-4 py-2 bg-accent text-white rounded-md"
         >
           Open Dialog
         </button>

         {/* Dialog component using modalSignal */}
         <Dialog 
           open={modal.isOpen()} 
           onOpenChange={modal.setOpen}
         >
           <Dialog.Portal>
             <Dialog.Overlay class="fixed inset-0 bg-black/50 z-40"/>
             <div class="fixed inset-0 flex items-center justify-center z-50">
               <Dialog.Content class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                 <Dialog.Title class="text-xl font-bold mb-4">Dialog Title</Dialog.Title>
                 <Dialog.Description class="text-gray-600 mb-4">
                   This is a dialog description.
                 </Dialog.Description>

                 <div class="flex justify-end gap-2 mt-4">
                   <button
                     type="button"
                     class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                     onClick={modal.close}
                   >
                     Cancel
                   </button>
                   <button
                     type="button"
                     class="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-400"
                     onClick={() => {
                       // Do something
                       modal.close();
                     }}
                   >
                     Confirm
                   </button>
                 </div>
               </Dialog.Content>
             </div>
           </Dialog.Portal>
         </Dialog>
       </>
     );
   }
   ```

 #### SolidJS createResource

 `createResource` is a SolidJS primitive for handling asynchronous data fetching with built-in loading and error states.

 ```tsx
import {createResource} from "solid-js";
 // Basic usage
 const [data, { mutate, refetch }] = createResource(fetchData);

 // With a source signal
 const [data, { mutate, refetch }] = createResource(source, fetchData);
 ```

 **Key features:**
 - `data()` returns the fetched data (undefined until resolved)
 - `data.loading` indicates if the request is in progress
 - `data.error` contains error information if the request failed
 - `data.latest` (v1.4.0+) returns the last received value without triggering Suspense
 - `data.state` (v1.5.0+) provides detailed state information: 'unresolved', 'pending', 'ready', 'refreshing', or 'errored'

 **Fetcher function:**
 ```tsx
 async function fetchData(source, { value, refetching }) {
   // source: value of the source signal (if provided)
   // value: previously fetched value
   // refetching: true when triggered by refetch(), or equals data passed to refetch(info)
   return await fetchSomeData();
 }
 ```

 **Utility methods:**
 - `mutate(newValue)`: directly update the data signal
 - `refetch(info?)`: re-run the fetcher with optional additional info

 **Options:**
 ```tsx
 createResource(fetcher, {
   name: "resourceName",           // For debugging
   initialValue: defaultData,      // Initial value before fetching
   deferStream: true,              // Wait for resolution before streaming (v1.4.0+)
   ssrLoadFrom: "initial",         // Use initialValue for SSR instead of fetching (v1.5.0+)
   storage: createCustomSignal,    // Custom storage implementation (v1.5.0+, experimental)
   onHydrated: (key, info) => {}   // Callback when resource is hydrated
 });
 ```

 ### Astro Actions

 - Actions should be used or created when implementing form submissions or API interactions.
- Actions are defined in the `/src/actions` folder.
- Group actions by functionality (auth, schedules, etc.).
- Follow the existing patterns for error handling and response formatting.
- Use TypeScript for type safety in action parameters and return values.
- Actions should only return JSON objects or throw errors. Do not return objects with status or headers.
  - ✅ `return { data: result };`
  - ❌ `return { status: 200, body: { data: result } };`

#### How to Use Actions

Actions provide a way to handle form submissions and API interactions directly within Astro components. Here's how to
use them:

1. **Creating an Action**:
   ```typescript
   // src/actions/example.ts
   import { defineAction, ActionError } from "astro:actions";

   export const example = {
     doSomething: defineAction({
       handler: async (formData, context) => {
         // Validate input
         const someValue = formData.get("someField");
         if (!someValue) {
           throw new ActionError({ code: 'INVALID_INPUT' });
         }

         // Perform operations (e.g., database queries)
         // ...

         // Return data
         return { success: true, data: { /* result data */ } };
       }
     })
   };
   ```

2. **Define action in index.ts**:
   ```typescript
    // src/actions/index.ts
    import {example} from './example.ts'

    export const actions = {
    //... other actions,
    example
    }
    ```

3. **Using Actions in Components**:
   ```typescript
   // In a SolidJS component
   import { actions } from 'astro:actions';

   const handleSubmit = async () => {
     const { data, error } = await actions.example.doSomething({ someField: "value" });
     if (error) {
       // Handle error
       console.error(error);
       return;
     }
     // Use data
     console.log(data);
   };
   ```

4. **Error Handling**:
    - Use `ActionError` for standardized error responses
    - Common error codes: 'UNAUTHORIZED', 'NOT_FOUND', 'INVALID_INPUT'
    - Check for errors in the response with `if (error)`
    - Possible Errors:
        - "BAD_REQUEST"
        - "UNAUTHORIZED"
        - "PAYMENT_REQUIRED"
        - "FORBIDDEN", "NOT_FOUND"
        - "METHOD_NOT_ALLOWED"
        - "NOT_ACCEPTABLE"
        - "PROXY_AUTHENTICATION_REQUIRED"
        - "REQUEST_TIMEOUT"
        - "CONFLICT"
        - "GONE"
        - "LENGTH_REQUIRED"
        - "PRECONDITION_FAILED"
        - "CONTENT_TOO_LARGE"
        - "URI_TOO_LONG"
        - "UNSUPPORTED_MEDIA_TYPE"
        - "RANGE_NOT_SATISFIABLE"
        - "EXPECTATION_FAILED"
        - "MISDIRECTED_REQUEST"
        - "UNPROCESSABLE_CONTENT"
        - "LOCKED"
        - "FAILED_DEPENDENCY"
        - "TOO_EARLY"
        - "UPGRADE_REQUIRED"
        - "PRECONDITION_REQUIRED"
        - "TOO_MANY_REQUESTS"
        - "REQUEST_HEADER_FIELDS_TOO_LARGE"
        - "UNAVAILABLE_FOR_LEGAL_REASONS"
        - "INTERNAL_SERVER_ERROR"
        - "NOT_IMPLEMENTED"
        - "BAD_GATEWAY"
        - "SERVICE_UNAVAILABLE"
        - "GATEWAY_TIMEOUT"
        - "HTTP_VERSION_NOT_SUPPORTED"
        - "VARIANT_ALSO_NEGOTIATES"
        - "INSUFFICIENT_STORAGE"
        - "LOOP_DETECTED"
        - "NETWORK_AUTHENTICATION_REQUIRED"

5. **Best Practices**:
    - Group related actions in the same file
    - Use descriptive names for action files and functions
    - Always validate input data
    - Include proper error handling with small, targeted try-catch blocks
    - Return consistent response structures
    - Use TypeScript for type safety

6. **Error Handling Best Practices**:
    - Use small, targeted try-catch blocks for each database operation
    - Avoid large try-catch blocks that encompass multiple operations
    - Log specific error messages for each type of failure
    - Throw appropriate ActionError with meaningful error codes and messages
    - Example of good error handling pattern:
      ```typescript
      // Authentication check
      const {session, user} = context.locals
      if (!session || !user) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Get database instance
      let db;
      try {
        db = getDB(context);
      } catch (error) {
        console.error('Database connection error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to the database'
        });
      }

      // Perform database query
      let results;
      try {
        results = await db.select()
          .from(someTable)
          .where(eq(someTable.id, id))
          .all();
      } catch (error) {
        console.error('Database query error:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve data from the database'
        });
      }
      ```

7. **Authentication in Actions**
    ```typescript
   export const actions = {
    someAction: defineAction({
      input: z.object({
        name: z.string(),
        slug: z.string(),
      }),
      handler: async ({name, slug}, ctx) => {
        const {user, session} = ctx.locals;
        if (!user || !session) {
          throw new ActionError({code: 'UNAUTHORIZED'})
        }
        // Rest of the actions logic...
      }
    })
   };
   ```

### API Endpoints

API endpoints provide server-side functionality that can be accessed via HTTP requests. They are implemented in the
`/src/pages/api/` directory.

#### Implementing API Paths

Here's how to implement API endpoints in the project:

1. **Creating an API Endpoint**:
   ```typescript
   // src/pages/api/example/[id].ts
   import type { APIRoute } from "astro";

   export const GET: APIRoute = async (context) => {
     // Get parameters from the URL
     const id = context.params.id;
     if (!id) {
       return new Response('ID is required', { status: 400 });
     }

     // Authentication check
     const token = context.cookies.get("session")?.value;
     if (!token) {
       return new Response('Unauthorized', { status: 401 });
     }

     // Perform operations (e.g., database queries)
     // ...

     // Return JSON response
     return new Response(JSON.stringify({ id, data: "example" }), {
       status: 200,
       headers: {
         'Content-Type': 'application/json'
       }
     });
   };

   // You can also implement other HTTP methods
   export const POST: APIRoute = async (context) => {
     // Implementation for POST requests
     // ...
   };
   ```

2. **Route Parameters**:
    - Use square brackets in filenames for dynamic parameters: `[id].ts`
    - Access parameters via `context.params`
    - For optional parameters, use `[[param]].ts` syntax

3. **Authentication**:
    - Always check authentication for protected endpoints
    - Use session cookies for authentication
    - Validate user permissions before processing requests

4. **Response Handling**:
    - Return appropriate HTTP status codes
    - Set correct Content-Type headers
    - Format JSON responses consistently
    - Include error details in error responses

5. **Best Practices**:
    - Organize endpoints logically in the directory structure
    - Keep endpoint handlers focused on a single responsibility
    - Validate all input parameters
    - Handle errors gracefully
    - Document API endpoints for other developers
    - Use TypeScript for type safety

### Astro Pages vs SolidJS Components

Understanding when to use Astro pages versus SolidJS components is crucial for efficient development.

#### When to Use Astro Pages

- For route-based views that represent entire pages
- When you need server-side rendering for SEO
- For pages with minimal client-side interactivity
- When you need to perform server-side operations before rendering
- For pages that integrate multiple interactive islands

#### When to Use SolidJS Components

- For highly interactive UI elements
- When you need client-side state management
- For reusable components across multiple pages
- When you need real-time updates and reactivity
- For complex forms and user inputs

#### Integration Patterns

1. **Client Directives**:
   ```astro
   <SolidComponent client:load />  <!-- Load and hydrate immediately -->
   <SolidComponent client:idle />  <!-- Load and hydrate when browser is idle -->
   <SolidComponent client:visible />  <!-- Load and hydrate when component is visible -->
   <SolidComponent client:only="solid-js" />  <!-- Only render on the client, not on the server -->
   ```

2. **Passing Data from Astro to SolidJS**:
   ```astro
   ---
   // Server-side code
   const serverData = await fetchSomeData();
   ---
   <SolidComponent data={serverData} client:load />
   ```

3. **Best Practices**:
    - Use Astro for page structure and SolidJS for interactive elements
    - Keep SolidJS components focused and reusable
    - Use appropriate client directives based on when the component needs to be interactive
    - Pass only necessary data from Astro to SolidJS components
    - Consider performance implications when choosing between server and client rendering

## Project Structure

- `/src`: Main source code
    - `/functions`: utility functions, third party api's
    - `/components`: SolidJS components
    - `/do`: Durable Objects
    - `/actions`: Astro actions grouped by functionality
    - `/lib`: Utility functions and hooks
        - `/db`: Database-related code
            - `/schema`: Database schema definitions
    - `/pages`: Astro pages

## Development Workflow

1. **Local Development**:
    - Run `npm run dev` to start the development server.
    - For Cloudflare Workers development, use `npm run cf:dev`.

2. **Database Migrations**:
    - Generate migrations: `npm run generate`
    - Apply migrations: `npm run migrate`
    - Local migrations: `npm run local:d1`

3. **Deployment**:
    - Deploy to Cloudflare: `npm run cf:deploy`
    - This builds the project and deploys it to Cloudflare Workers.

## Best Practices

### TypeScript

- Use explicit types rather than `any`.
- Leverage TypeScript's inference when appropriate.
- Use interfaces for object shapes and types for unions/primitives.

### Database

- Use Drizzle's query builder for type-safe queries.
- Follow the existing pattern for table definitions.
- Keep schema changes backward compatible when possible.
- Document schema changes in migration files.

### Durable Objects

- Use Durable Objects for stateful operations only.
- Keep Durable Object code focused and minimal.
- Handle WebSocket connections properly with appropriate error handling.
- Use storage methods for persistence.

### Authentication

- Always use the provided auth utilities.
- Don't expose sensitive auth information.
- Follow the OAuth flow for social providers.
- Test authentication flows thoroughly.

### SolidJS

- Keep components small and focused.
- Use props for component configuration.
- Leverage SolidJS's fine-grained reactivity.
- Use stores for complex state management.
- Follow the existing patterns for hooks and components.

## Testing

- Test components and utilities thoroughly.
- Ensure authentication flows work correctly.
- Test database migrations before applying them to production.
- Verify WebSocket connections and Durable Object behavior.

## Deployment

- The project is deployed to Cloudflare Workers.
- Use `npm run cf:deploy` to deploy.
- Ensure all environment variables are set in the Cloudflare dashboard.
- Verify the deployment by testing key functionality.

## Troubleshooting

- Check Cloudflare Workers logs for errors.
- Verify database connections and migrations.
- Test authentication flows with different providers.
- Check WebSocket connections for real-time features.

## Design System

The JingleJam Community Page follows a consistent design system to ensure a cohesive user experience across all pages
and components.

### Color Palette

#### Primary Colors

- **Primary**: #E30E50 (vibrant pink/red)
    - Used for main branding, primary buttons, and important UI elements
    - Shades range from 50 (#FAAFC6) to 950 (#000000)
    - Default shade: #E30E50
    - Dark shade: #57051f

#### Secondary Colors

- **Accent**: #3584BF (blue)
    - Used for secondary elements, highlights, and interactive components
    - Shades range from 50 (#BED9ED) to 950 (#000000)
    - Default shade: #3584BF
    - Dark shade: #09437a

#### Brand Colors

- **Yogscast Primary**: #1E95EF (blue)
    - Used for Yogscast-specific elements
    - Shades range from 50 (#C9E6FB) to 900 (#03192A)

- **Yogscast Accent**: #F67932 (orange)
    - Used for Yogscast-specific highlights and accents
    - Shades range from 50 (#FEECE2) to 900 (#451B03)

#### Social Media Colors

- **Twitch**: #9146FF
- **YouTube**: #FF0000
- **Reddit**: #FF4500
- **Discord**: #5865F2
- **GitHub**: #4078C0

#### Utility Colors

- **Overlay**: #ffffff05 (very light white with transparency)
    - Used for overlay effects

### Typography

#### Font Families

- **Poppins**: Primary font for body text and UI elements
    - Weights: Bold (700), Bold Italic (700), ExtraBold (800)
    - Used for general text content

- **Bebas Neue**: Display font for headings and titles
    - Weight: Regular (400)
    - Used for large titles and headers

- **Inter**: Secondary sans-serif font
    - Used as a fallback and for specific UI elements

- **Mono**: Used for code and numeric displays (like countdown timers)

#### Font Sizes

- Text sizes follow a scale from xxs to 4xl:
    - xxs: 0.625rem (custom size)
    - base: Default text size
    - lg: Large text
    - xl: Extra large text
    - 2xl: Double extra large text
    - 3xl: Triple extra large text
    - 4xl: Quadruple extra large text

- Fluid Typography:
    - The project uses fluid-tailwind for responsive text sizing
    - Syntax: ~text-2xl/4xl (scales between 2xl on mobile to 4xl on desktop)

### Layout Patterns

#### Page Structure

- Pages use a consistent structure defined in BaseLayout:
    - Gradient background (from-primary-shade via-primary to-primary-shade)
    - Navigation at the top
    - Main content area with centered alignment
    - Footer at the bottom

#### Grid System

- Uses Tailwind's grid system for layouts:
    - Single column on mobile (grid-cols-1)
    - Multiple columns on larger screens (e.g., md:grid-cols-3)

#### Spacing

- Consistent spacing using Tailwind's spacing scale:
    - Gap spacing between elements (gap-2, gap-4, gap-8)
    - Margin for separation (m-2, my-2, mx-4)
    - Padding for internal spacing (p-2, px-4, py-8)

#### Responsive Design

- Mobile-first approach with breakpoints:
    - Default styles for mobile
    - md: Medium screens and up
    - lg: Large screens and up
    - xl: Extra large screens and up
- Different layouts for different screen sizes:
    - Single column on mobile, multiple columns on larger screens
    - Hidden/visible elements based on screen size (hidden md:flex, md:hidden)
    - Adjusted spacing and sizing for different screens

### Component Styles

#### Navigation

- **Desktop Navigation**:
    - Horizontal layout with centered items
    - Simple text links with hover effects
    - Dropdown menus for nested navigation

- **Mobile Navigation**:
    - Toggle button with menu/close icon
    - Vertical stacked links when expanded
    - Accent background with rounded corners

#### Buttons

- Text buttons with underline on hover
- Icon buttons with hover scaling effects
- Background colors based on purpose (primary, accent)

#### Cards and Containers

- Rounded corners (rounded-lg, rounded-2xl)
- Consistent padding and margin
- Background colors to create visual hierarchy

#### Interactive Elements

- Hover effects:
    - Scale transformations (hover:scale-110)
    - Color changes (hover:text-accent-50)
    - Underlines for links (underline)
- Transitions for smooth interactions (transition-all)

#### Icons

- SVG icons for social media and UI elements
- Consistent sizing using the size utility
- Fluid sizing for responsive displays (~size-4/6)

### Background Images

- Several Jingle Jam background images in grayscale:
    - jj_background
    - jj_background_2
    - jj_background_3
    - jj_background_4

### Best Practices

1. **Color Usage**:
    - Use primary colors for main UI elements and branding
    - Use accent colors for secondary elements and highlights
    - Use brand colors for platform-specific elements
    - Maintain sufficient contrast for accessibility

2. **Typography**:
    - Use Poppins for body text and UI elements
    - Use Bebas Neue for headings and titles
    - Use fluid typography for responsive text sizing
    - Maintain a consistent hierarchy with font sizes

3. **Layout**:
    - Follow the mobile-first approach
    - Use the grid system for complex layouts
    - Maintain consistent spacing
    - Ensure responsive behavior across all screen sizes

4. **Components**:
    - Reuse existing component patterns
    - Maintain consistent styling across similar components
    - Use Tailwind utility classes for styling
    - Follow the established patterns for interactive elements

By following these design guidelines, you'll maintain visual consistency across the JingleJam Community Page and ensure
a cohesive user experience.

## Architecture Guidelines: Astro Actions with TinyBase Durable Objects

### Overview

This document outlines the architecture used in the JingleJam Community Page project, which combines Astro Actions for API endpoints with Cloudflare Durable Objects using TinyBase for state management. This architecture enables real-time, collaborative features with persistent state.

### Core Architecture Components

#### 1. Astro Actions
- Server-side API endpoints that handle user requests
- Validate input data and user authentication
- Coordinate operations between client, database, and Durable Objects
- Return standardized responses to the client

#### 2. TinyBase Durable Objects
- Stateful objects that persist across requests
- Use TinyBase for reactive state management
- Maintain synchronized state between memory and database
- Handle WebSocket connections for real-time updates

#### 3. Database (Cloudflare D1)
- Source of truth for all persistent data
- Accessed through Drizzle ORM for type-safe queries
- Schema defined in `src/lib/db/schema/`

#### 4. WebSocket Connections
- Enable real-time communication between clients and Durable Objects
- Client connects to WebSocket endpoints that forward to appropriate Durable Objects
- TinyBase automatically synchronizes state changes to connected clients

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│  Client UI  │◄────┤ WebSockets  │◄────┤ Durable Objects     │
│ (Browser)   │     │ Connection  │     │ (TinyBase Stores)   │
└─────┬───────┘     └─────────────┘     └────────┬────────────┘
      │                                          │
      │                                          │
      │                                          │
      ▼                                          ▼
┌─────────────┐                          ┌─────────────────┐
│ Astro       │                          │                 │
│ Actions     │─────────────────────────►│    Database     │
│ (API Layer) │                          │                 │
└─────────────┘                          └─────────────────┘
```

1. **Write Operations**:
    - Client calls Astro Action
    - Action validates input and authenticates user
    - Action calls appropriate Durable Object
    - Durable Object updates its TinyBase store and the database
    - TinyBase automatically broadcasts changes to connected clients

2. **Read Operations**:
    - Initial data load comes from database via Astro
    - Real-time updates come from Durable Objects via WebSockets
    - TinyBase synchronizes state between server and client

### TinyBase Durable Objects

#### TinybaseDO Abstract Class

The `TinybaseDO` abstract class provides the foundation for all Durable Objects that use TinyBase:

```typescript
export abstract class TinybaseDO extends WsServerDurableObject<Env> {
  protected store?: MergeableStore;
  protected persister?: DurableObjectStoragePersister;

  protected constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      await this.addDOToTable();
    });
  }

  protected abstract namespace(): string;

  // Logging and error handling methods
  protected log(...optionalParams: any[]) {
    console.log(this.namespace(), ...optionalParams);
  }

  protected error(...optionalParams: any[]) {
    console.error(this.namespace(), ...optionalParams);
  }

  // Create TinyBase store and persister
  createPersister() {
    if (this.persister) {
      return this.persister;
    }
    this.log('createPersister', 'Creating store and persister');
    this.store = createMergeableStore();
    this.persister = createDurableObjectStoragePersister(
      this.store,
      this.ctx.storage,
    );
    return this.persister;
  }
}
```

Key features:
- Extends `WsServerDurableObject` for WebSocket handling
- Uses `MergeableStore` for conflict-free state management
- Provides persistence with `DurableObjectStoragePersister`
- Includes logging and error handling utilities
- Requires implementing classes to define their namespace

#### Creating a TinyBase Durable Object

To create a new Durable Object with TinyBase:

1. **Create a class that extends TinybaseDO**:
   ```typescript
   export class EntityDO extends TinybaseDO {
     protected namespace(): string {
       return "EntityDO";
     }

     get entityId() {
       return parseInt(this.ctx.id.name!);
     }

     constructor(ctx: DurableObjectState, env: Env) {
       super(ctx, env);
       this.ctx.blockConcurrencyWhile(async () => {
         await this.loadDataFromDatabase();
       });
     }

     private async loadDataFromDatabase() {
       if (!this.store) {
         this.createPersister(); // Initialize store and persister
       }

       const db = drizzle(this.env.DB);
       const data = await db.select().from(entityTable)
         .where(eq(entityTable.id, this.entityId));

       // Update local store
       for (const item of data) {
         this.store!.setRow('entities', item.id.toString(), item);
       }
     }

     // Add methods to manipulate data
     async addItem(item) {
       // Add to database
       const db = drizzle(this.env.DB);
       await db.insert(entityTable).values(item);

       // Update local store - TinyBase will automatically sync with clients
       this.store!.setRow('entities', item.id.toString(), item);
     }
   }
   ```

2. **Register in wrangler.jsonc**:
   ```json
   {
     "durable_objects": {
       "bindings": [
         {
           "name": "EntityDO",
           "class_name": "EntityDO"
         }
       ]
     }
   }
   ```

3. **Create a WebSocket endpoint**:
   ```typescript
   // src/pages/api/ws/entities/[entityId].ts
   export const ALL: APIRoute = async (ctx) => {
     const entityId = ctx.params.entityId;
     if (!entityId) {
       return new Response('Entity ID is required', {status: 400});
     }

     // Authentication check
     const token = ctx.cookies.get("session")?.value;
     if (!token) {
       return new Response('Unauthorized', {status: 401});
     }

     // Get the EntityDO for this entity
     const EntityDO = ctx.locals.runtime.env.EntityDO;
     const entityDOId = EntityDO.idFromName(entityId);
     const stubEntityDO = EntityDO.get(entityDOId);

     // Forward the request to the Durable Object
     return stubEntityDO.fetch(ctx.request);
   };
   ```

#### TinyBase Store Structure

When working with TinyBase in Durable Objects, organize your data as follows:

1. **Tables**: Collections of related data (e.g., 'users', 'schedules', 'invites')
2. **Rows**: Individual items in a table, identified by a unique ID
3. **Cells**: Individual values within a row

Example store structure:
```
store
├── tables
│   ├── schedules
│   │   ├── 1 (row id)
│   │   │   ├── id: 1
│   │   │   ├── title: "Schedule 1"
│   │   │   ├── year: 2023
│   │   │   └── visible: true
│   │   └── 2 (row id)
│   │       ├── id: 2
│   │       ├── title: "Schedule 2"
│   │       ├── year: 2024
│   │       └── visible: false
│   └── invites
│       ├── 101 (row id)
│       │   ├── teamId: 101
│       │   └── invitedUserId: 42
│       └── 102 (row id)
│           ├── teamId: 102
│           └── invitedUserId: 42
└── values
    └── userId: 42
```

#### Common TinyBase Operations

```typescript
// Set a row
this.store.setRow('schedules', '1', {
  id: 1,
  title: 'Schedule 1',
  year: 2023,
  visible: true
});

// Get a row
const schedule = this.store.getRow('schedules', '1');

// Update a specific cell
this.store.setCell('schedules', '1', 'title', 'Updated Schedule 1');

// Delete a row
this.store.delRow('schedules', '1');

// Perform multiple operations atomically
await this.store.transaction(async () => {
  this.store.setRow('schedules', '1', { /* data */ });
  this.store.setRow('invites', '101', { /* data */ });
});
```

#### SolidJS createSignal

```tsx
import { createSignal } from "solid-js"

function createSignal<T>(
	initialValue: T,
	options?: {
		equals?: false | ((prev: T, next: T) => boolean)
		name?: string
		internal?: boolean
	}
): [get: () => T, set: (v: T) => T]

// available types for return value of createSignal:
import type { Signal, Accessor, Setter } from "solid-js"
type Signal<T> = [get: Accessor<T>, set: Setter<T>]
type Accessor<T> = () => T
type Setter<T> = (v: T | ((prev?: T) => T)) => T

```

Signals are the most basic reactive primitive. 
They track a single value (which can be a value of any type) that changes over time.

The Signal's value starts out equal to the passed first argument `initialValue` (or undefined if there are no arguments).
The `createSignal` function returns a pair of functions as a two-element array: a getter (or accessor) and a setter.
In typical use, you would destructure this array into a named Signal like so:

```tsx
const [count, setCount] = createSignal(0)
const [ready, setReady] = createSignal(false)
```

Calling the getter (e.g., `count()` or `ready()`) returns the current value of the Signal.

Crucial to automatic dependency tracking, calling the getter within a tracking scope causes the calling function to depend on this Signal, so that function will rerun if the Signal gets updated.

Calling the setter (e.g., `setCount(nextCount)` or `setReady(nextReady)`) sets the Signal's value and updates the Signal (triggering dependents to rerun) if the value actually changed (see details below). 
The setter takes either the new value for the signal or a function that maps the previous value of the signal to a new value as its only argument. 
The updated value is also returned by the setter. As an example:

```tsx
// read signal's current value, and
// depend on signal if in a tracking scope
// (but nonreactive outside of a tracking scope):
const currentCount = count()

// or wrap any computation with a function,
// and this function can be used in a tracking scope:
const doubledCount = () => 2 * count()

// or build a tracking scope and depend on signal:
const countDisplay = <div>{count()}</div>

// write signal by providing a value:
setReady(true)

// write signal by providing a function setter:
const newCount = setCount((prev) => prev + 1)

```

:::info
	If you want to store a function in a Signal you must use the function form:

	```tsx
	setValue(() => myFunction);
	```

	However, functions are not treated specially as the `initialValue` argument to `createSignal`, so you can pass a
	function initial value as is:

	```tsx
	const [func, setFunc] = createSignal(myFunction);
	```

:::

##### Options

| Name       | Type                                       | Default | Description                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `equals`   | `false \| ((prev: T, next: T) => boolean)` | `===`   | A function that determines whether the Signal's value has changed. If the function returns true, the Signal's value will not be updated and dependents will not rerun. If the function returns false, the Signal's value will be updated and dependents will rerun. |
| `name`     | `string`                                   |         | A name for the Signal. This is useful for debugging.                                                                                                                                                                                                                |
| `internal` | `boolean`                                  | `false` | If true, the Signal will not be accessible in the devtools.                                                                                                                                                                                                         |

###### `equals`

The `equals` option can be used to customize the equality check used to determine whether the Signal's value has changed.
By default, the equality check is a strict equality check (`===`).
If you want to use a different equality check, you can pass a custom function as the `equals` option.
The custom function will be called with the previous and next values of the Signal as arguments.
If the function returns true, the Signal's value will not be updated and dependents will not rerun.
If the function returns false, the Signal's value will be updated and dependents will rerun.

```tsx
const [count, setCount] = createSignal(0, {
	equals: (prev, next) => prev === next,
})
```

Here are some examples of this option in use:

```tsx
// use { equals: false } to allow modifying object in-place;
// normally this wouldn't be seen as an update because the
// object has the same identity before and after change
const [object, setObject] = createSignal({ count: 0 }, { equals: false })
setObject((current) => {
	current.count += 1
	current.updated = new Date()
	return current
})

// use { equals: false } to create a signal that acts as a trigger without storing a value:
const [depend, rerun] = createSignal(undefined, { equals: false })
// now calling depend() in a tracking scope
// makes that scope rerun whenever rerun() gets called

// define equality based on string length:
const [myString, setMyString] = createSignal("string", {
	equals: (newVal, oldVal) => newVal.length === oldVal.length,
})

setMyString("string") // considered equal to the last value and won't cause updates
setMyString("stranger") // considered different and will cause updates
```

###### `name`

The `name` option can be used to give the Signal a name.
This is useful for debugging. The name will be displayed in the devtools.

```tsx
const [count, setCount] = createSignal(0, { name: "count" })
```

###### `internal`

The `internal` option can be used to hide the Signal from the devtools.
This is useful for Signals that are used internally by a component and should not be exposed to the user.

```tsx
const [count, setCount] = createSignal(0, { internal: true })
```

#### SolidJS createMemo

```tsx
import { createMemo } from "solid-js"

function createMemo<T>(
	fn: (v: T) => T,
	value?: T,
	options?: { equals?: false | ((prev: T, next: T) => boolean) }
): () => T

```

Memos let you efficiently use a derived value in many reactive computations. 
`createMemo` creates a readonly reactive value equal to the return value of the given function and makes sure that function only gets executed when its dependencies change.

Here's an example of how createMemo can be used:

```ts
const value = createMemo(() => computeExpensiveValue(a(), b()))

//read the value
value()
```

In Solid, you often don't need to wrap functions in memos; you can alternatively just define and call a regular function to get similar reactive behavior. 
The main difference is when you call the function in multiple reactive settings. 
In this case, when the function's dependencies update, the function will get called multiple times unless it is wrapped in createMemo. 
For example:

```tsx
const user = createMemo(() => searchForUser(username()))
// compare with: const user = () => searchForUser(username());
return (
	<ul>
		<li>Your name is {user()?.name}</li>
		<li>
			Your email is <code>{user()?.email}</code>
		</li>
	</ul>
)
```

When the username signal updates, searchForUser will get called just once. 
If the returned user actually changed, the user memo updates, and then both list items will update automatically.

If we had instead defined user as a plain function `() => searchForUser(username())`, then `searchForUser` would have been called twice, once when updating each list item.

Another key difference is that a memo can shield dependents from updating when the memo's dependencies change but the resulting memo value doesn't. 
Like [createSignal](/reference/basic-reactivity/create-signal), the derived signal made by `createMemo` updates (and triggers dependents to rerun) only when the value returned by the memo function actually changes from the previous value, according to JavaScript's `===` operator. 
Alternatively, you can pass an options object with `equals` set to false to always update the memo when its dependencies change, or you can pass your own `equals` function for testing equality.

The memo function is called with an argument equal to the value returned from the previous execution of the memo function, or, on the first call, equal to the optional second argument to `createMemo`. 
This is useful for reducing computations, such as:

```tsx
// track the sum of all values taken on by input() as it updates
const sum = createMemo((prev) => input() + prev, 0)
```

The memo function should not change other signals by calling setters (it should be "pure"). 
This enables Solid to optimize the execution order of memo updates according to their dependency graph, so that all memos can update at most once in response to a dependency change.

##### Options and arguments

| Name    | Type                                                    | Description                                                    |
| :------ | :------------------------------------------------------ | :------------------------------------------------------------- |
| fn      | `(v: T) => T`                                           | The function to memoize.                                       |
| value   | `T`                                                     | The initial value of the memo.                                 |
| options | `{ equals?: false \| ((prev: T, next: T) => boolean) }` | An optional object with an `equals` function to test equality. |

#### SolidJS createEffect

```tsx
import { createEffect } from "solid-js"

function createEffect<T>(fn: (v: T) => T, value?: T): void

```

Effects are a general way to make arbitrary code ("side effects") run whenever dependencies change, e.g., to modify the DOM manually.
`createEffect` creates a new computation that runs the given function in a tracking scope, thus automatically tracking its dependencies, and automatically reruns the function whenever the dependencies update.

For example:

```tsx
const [a, setA] = createSignal(initialValue)

// effect that depends on signal `a`
createEffect(() => doSideEffect(a()))
```

The effect will run whenever `a` changes value.

The effect will also run once, immediately after it is created, to initialize the DOM to the correct state. This is called the "mounting" phase.
However, we recommend using `onMount` instead, which is a more explicit way to express this.

The effect callback can return a value, which will be passed as the `prev` argument to the next invocation of the effect.
This is useful for memoizing values that are expensive to compute. For example:

```tsx
const [a, setA] = createSignal(initialValue)

// effect that depends on signal `a`
createEffect((prevSum) => {
	// do something with `a` and `prevSum`
	const sum = a() + b()
	if (sum !== prevSum) console.log("sum changed to", sum)
	return sum
}, 0)
// ^ the initial value of the effect is 0
```

Effects are meant primarily for side effects that read but don't write to the reactive system: it's best to avoid setting signals in effects, which without care can cause additional rendering or even infinite effect loops. Instead, prefer using [createMemo](/reference/basic-reactivity/create-memo) to compute new values that depend on other reactive values, so the reactive system knows what depends on what, and can optimize accordingly.
If you do end up setting a signal within an effect, computations subscribed to that signal will be executed only once the effect completes; see [`batch`](/reference/reactive-utilities/batch) for more detail.

The first execution of the effect function is not immediate; it's scheduled to run after the current rendering phase (e.g., after calling the function passed to [render](/reference/rendering/render), [createRoot](/reference/reactive-utilities/create-root), or [runWithOwner](/reference/reactive-utilities/run-with-owner)).
If you want to wait for the first execution to occur, use [queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) (which runs before the browser renders the DOM) or `await Promise.resolve()` or `setTimeout(..., 0)` (which runs after browser rendering).

```tsx
// assume this code is in a component function, so is part of a rendering phase
const [count, setCount] = createSignal(0)

// this effect prints count at the beginning and when it changes
createEffect(() => console.log("count =", count()))
// effect won't run yet
console.log("hello")
setCount(1) // effect still won't run yet
setCount(2) // effect still won't run yet

queueMicrotask(() => {
	// now `count = 2` will print
	console.log("microtask")
	setCount(3) // immediately prints `count = 3`
	console.log("goodbye")
})

// --- overall output: ---
// hello
// count = 2
// microtask
// count = 3
// goodbye
```

This delay in first execution is useful because it means an effect defined in a component scope runs after the JSX returned by the component gets added to the DOM.
In particular, [refs](/reference/jsx-attributes/ref) will already be set.
Thus you can use an effect to manipulate the DOM manually, call vanilla JS libraries, or other side effects.

Note that the first run of the effect still runs before the browser renders the DOM to the screen (similar to React's `useLayoutEffect`).
If you need to wait until after rendering (e.g., to measure the rendering), you can use `await Promise.resolve()` (or `Promise.resolve().then(...)`), but note that subsequent use of reactive state (such as signals) will not trigger the effect to rerun, as tracking is not possible after an async function uses `await`.
Thus you should use all dependencies before the promise.

If you'd rather an effect run immediately even for its first run, use [createRenderEffect](/reference/secondary-primitives/create-render-effect) or [createComputed](/reference/secondary-primitives/create-computed).

You can clean up your side effects in between executions of the effect function by calling [onCleanup](/reference/lifecycle/on-cleanup) inside the effect function.
Such a cleanup function gets called both in between effect executions and when the effect gets disposed (e.g., the containing component unmounts).
For example:

```tsx
// listen to event dynamically given by eventName signal
createEffect(() => {
	const event = eventName()
	const callback = (e) => console.log(e)
	ref.addEventListener(event, callback)
	onCleanup(() => ref.removeEventListener(event, callback))
})
```

##### Arguments

- `fn` - The function to run in a tracking scope. It can return a value, which will be passed as the `prev` argument to the next invocation of the effect.
- `value` - The initial value of the effect. This is useful for memoizing values that are expensive to compute.

### Astro Actions

Astro Actions serve as the API layer for client interactions:

```typescript
// src/actions/entities.ts
import {ActionError, defineAction} from "astro:actions";

export const entities = {
  create: defineAction({
    input: z.object({
      name: z.string(),
      description: z.string(),
    }),
    handler: async ({name, description}, ctx) => {
      // Authentication check
      const {user, session} = ctx.locals;
      if (!user || !session) {
        throw new ActionError({code: 'UNAUTHORIZED'});
      }

      // Create entity in database
      const db = getDB(ctx);
      const [entity] = await db.insert(entityTable)
        .values({
          name,
          description,
          ownerId: user.id,
        })
        .returning();

      // Initialize EntityDO with TinyBase
      const EntityDO = ctx.locals.runtime.env.EntityDO;
      const doId = EntityDO.idFromName(entity.id.toString());
      const stub = EntityDO.get(doId);

      // Call the Durable Object to initialize
      await stub.init();
      return entity.id;
    }
  }),
  callDOFunc: defineAction({
    input: z.object({
      entityId: z.number(),
      someParam: z.number(),
    }),
    handle: async ({entityId, someParam}, ctx) => {
      const EntityDO = ctx.locals.runtime.env.EntityDO;
      const doId = EntityDO.idFromName(entity.id.toString());
      const stub = EntityDO.get(doId);

      try {
        const result = await stub.someFunction(someParam)
      } catch (e) {
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: e.message})
      }
      return result
    }
  })
}
```

### Client-Side Integration

#### WebSocket Hook

The `useWebsocket` hook provides client-side WebSocket functionality:

```typescript
// src/lib/useWebsocket.ts
export const useWebsocket = (path: string) => {
  const url = new URL(path, window.location.origin);
  const ws = new WebSocket(url.href);

  const [store, setStore] = createStore<UseWebsocket>({
    lastMessage: undefined,
    messages: []
  });

  onMount(() => {
    ws.onopen = () => {
      console.log("WebSocket connection opened");
      sendMessage('data');
    };

    ws.onmessage = (event) => {
      console.log("Message from server: ", event.data);
      setStore("lastMessage", event);
      setStore("messages", (messages) => [...messages, event]);
    };
  });

  onCleanup(() => {
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
  });

  const sendMessage = (message: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  };

  return {data: store, sendMessage};
};
```

#### TinyBase Client Synchronization

For more advanced TinyBase synchronization:

```typescript
import { createStore } from 'tinybase';
import { createWsClientSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';

function useEntityStore(entityId) {
  const [store, setStore] = createSignal(null);
  const [status, setStatus] = createSignal('connecting');

  onMount(() => {
    // Create a TinyBase store
    const localStore = createStore();
    setStore(localStore);

    // Create WebSocket URL
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/entities/${entityId}`;

    // Create synchronizer
    const synchronizer = createWsClientSynchronizer(
      localStore,
      wsUrl,
      {
        onStatusChange: (newStatus) => {
          setStatus(newStatus === 'connected' ? 'connected' : 'disconnected');
        }
      }
    );

    // Start synchronization
    synchronizer.start();

    return () => {
      synchronizer.stop();
    };
  });

  return { store, status };
}
```

### Common Patterns

#### Entity Creation Flow

1. Client submits form data to an Astro Action
2. Action validates input and creates entity in database
3. Action initializes a Durable Object for the entity
4. Durable Object loads entity data from database into TinyBase store
5. Client connects to entity via WebSocket for real-time updates

#### Real-Time Collaboration

1. Multiple clients connect to the same Durable Object via WebSockets
2. Each client sends changes through Astro Actions
3. Actions validate and process changes
4. Durable Object updates its TinyBase store and the database
5. TinyBase automatically broadcasts changes to all connected clients

#### Data Synchronization

1. Durable Object maintains TinyBase store synchronized with database
2. Write operations update both TinyBase store and database
3. Read operations serve from TinyBase store when possible
4. TinyBase handles client synchronization automatically

### Best Practices

#### TinyBase and Durable Objects

1. **Initialize Store Early**
    - Create the TinyBase store and persister in the constructor
    - Load initial data from the database during initialization
    - Use `blockConcurrencyWhile` to ensure initialization completes before handling requests

2. **Maintain Data Consistency**
    - Always update both the database and TinyBase store
    - Use transactions for related operations
    - Consider the order of operations (database first, then store)

3. **Optimize Store Structure**
    - Design your table structure to match access patterns
    - Use appropriate row IDs for efficient lookups
    - Keep related data in the same table when possible

4. **Handle WebSocket Connections Properly**
    - Let TinybaseDO handle WebSocket connections
    - Implement proper authentication in WebSocket endpoints
    - Use the built-in synchronization mechanisms

5. **Error Handling**
    - Use the provided logging methods
    - Catch and handle exceptions appropriately
    - Provide meaningful error messages

#### Astro Actions

1. **Authentication**
    - Always validate authentication in both Astro Actions and WebSocket endpoints
    - Use secure, HTTP-only cookies for session management
    - Implement CSRF protection for actions

2. **Input Validation**
    - Use Zod for schema validation
    - Validate all input data before processing
    - Return descriptive error messages for invalid inputs

3. **Error Handling**
    - Use `ActionError` for standardized error responses
    - Include appropriate error codes and messages
    - Handle errors gracefully on the client side

4. **Database Operations**
    - Use Drizzle's query builder for type-safe queries
    - Follow the existing pattern for table definitions
    - Keep schema changes backward compatible when possible

### Conclusion

This architecture provides a powerful foundation for building real-time, collaborative web applications. By combining Astro Actions for API endpoints with Durable Objects using TinyBase for state management, you can create applications that are both responsive and scalable.

The key benefits of this architecture are:
- Clear separation of concerns
- Real-time updates through WebSockets
- Persistent state with TinyBase
- Type safety with TypeScript
- Scalability with Cloudflare Workers and Durable Objects

By following these guidelines, you'll maintain consistency in the codebase and ensure that the project continues to function correctly as it evolves.
