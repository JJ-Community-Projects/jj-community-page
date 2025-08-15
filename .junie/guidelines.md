# JingleJam Community Page - Development Guidelines

## Overview

Essential development guidelines for the JingleJam Community Page project. This document focuses on project-specific information and references comprehensive local documentation.

## Local Project Documentation

This project maintains comprehensive documentation in the `.junie/docs/` directory. Always consult these local docs first before searching external resources:

### 🎨 UI & Components
- **[.junie/docs/ui/UI_README.md]** - Complete UI documentation overview (168 components: 131 SolidJS + 37 Astro)
- **[.junie/docs/ui/STYLING_README.md]** - Design system, color palettes, typography, and styling guidelines
- **[.junie/docs/ui/COMPONENTS_README.md]** - Component patterns, integration guidelines, and best practices

### 🗄️ Database & ORM
- **[.junie/docs/database/DATABASE_README.md]** - Complete database documentation (23 tables, 9 views, 6 schema files)
  - Database configuration and Cloudflare D1 setup
  - Schema definitions and migration management
  - Query patterns and integration with Astro Actions/Durable Objects
  - Performance optimization and best practices

### 🏗️ Architecture & Real-time Features
- **[.junie/docs/architecture/ARCHITECTURE_README.md]** - TinyBase Durable Objects architecture patterns
  - Data flow patterns and real-time synchronization
  - WebSocket communication and collaborative editing
  - Astro Actions integration with Durable Objects

### 🔌 API & Procedures
- **[.junie/docs/orpc/ORPC_README.md]** - Complete oRPC implementation documentation
  - Public and private procedures
  - Middleware system (auth, database, context)
  - Contract-first development patterns
  - **[.junie/docs/orpc/tanstack-integration.md]** - oRPC TanStack Query integration guide
    - Type-safe reactive data fetching and caching
    - Query and mutation patterns with SolidJS
    - Cache management and invalidation strategies
    - Performance optimization and error handling

## Accessing External Documentation

When local documentation doesn't cover your needs, use these MCP servers to access online documentation:

### Core Framework Documentation
```typescript
// SolidJS Documentation
mcp_solidjs-docs_list_doc_sources()
mcp_solidjs-docs_fetch_docs("https://context7.com/solidjs/solid-docs/llms.txt")

// Astro Documentation  
mcp_astro-docs_list_doc_sources()
mcp_astro-docs_fetch_docs("https://docs.astro.build/llms.txt")

// TailwindCSS v3 Documentation
mcp_tailwindv3-docs_list_doc_sources()
mcp_tailwindv3-docs_fetch_docs("https://context7.com/context7/v3_tailwindcss/llms.txt")
```

### Additional Available MCP Servers
- `mcp_cloudflare-docs_*` - Cloudflare Workers, D1, Durable Objects
- `mcp_drizzle-docs_*` - Drizzle ORM documentation
- `mcp_solidjs-kobalte-docs_*` - Kobalte accessible components
- `mcp_zod-docs_*` - Zod schema validation
- `mcp_orpc-docs_*` - oRPC framework documentation

## Project-Specific Development Information

### Task Execution Principles

**All development tasks** should follow these core principles to maximize efficiency and enable parallel execution:

#### 1. Structure for Maximum Parallelization
Design any task so that as many sub-components as possible can be run in parallel by:
- Identifying which sub-tasks can run independently
- Grouping dependent sub-tasks into logical sequences
- Clearly defining data flow between dependent sub-tasks
- Using shared resources efficiently to avoid conflicts

#### 2. Create Small, Focused Tasks
Break down complex operations into small, independent tasks with:
- Single responsibility per task
- Clear input/output requirements
- Minimal external dependencies
- Self-contained execution scope

#### 3. Minimize Task Dependencies
Structure tasks to reduce interdependencies by:
- Analyzing prerequisite relationships between tasks
- Creating parallel execution streams where possible
- Avoiding unnecessary sequential constraints
- Designing tasks that can proceed without waiting for others

#### 4. Optimize for Concurrent Execution
Design task structure with:
- Parallel execution streams where possible
- Clear separation of concerns between tasks
- Efficient resource utilization patterns
- Minimal blocking operations between tasks

These principles apply to **all development work**, including:
- Code implementation tasks
- Database operations and migrations
- Component development
- Testing and validation
- Documentation updates
- Bug fixes and issue resolution
- Feature development
- Refactoring operations

### File Processing and Analysis

When you need to read many files at once, use the `.bash/create_tmp.sh` script:

```bash
# Basic usage (searches for impl.ts files in src/)
./.bash/create_tmp.sh

# Custom search patterns
./.bash/create_tmp.sh -p "*.ts" -s "src/lib/orpc" -o ".tmp/orpc_files.txt"
./.bash/create_tmp.sh -p "schema.*.ts" -s "src/lib/db" -o ".tmp/schema_files.txt"
./.bash/create_tmp.sh -p "index.tsx" -s "src/components" -o ".tmp/component_index.txt"

# Then read the consolidated file
cat .tmp/consolidated_files.txt
```

### Information Gathering Workflow

When you need additional information, follow this priority order:

1. **Search local docs first**: Check `.junie/docs/**/*_README.md` files
2. **Use MCP servers**: Access online documentation via the MCP servers listed above
3. **Ask the user**: When neither local docs nor online docs provide the needed information

### Plan Creation and Storage

When instructed to create a plan, always:

1. **Create a markdown file**: Write the plan in a dedicated `.md` file
2. **Store in `.junie/plans`**: Place all plan files in the `.junie/plans` directory
3. **Structure for maximum parallelization**: Design plans so that as many tasks as possible can be run in parallel by:
    - Identifying which tasks can run independently
    - Grouping dependent tasks into logical sequences
    - Clearly defining data flow between dependent tasks
    - Using shared resources efficiently to avoid conflicts
4. **Create small, focused tasks**: Break down complex operations into small, independent tasks with:
    - Single responsibility per task
    - Clear input/output requirements
    - Minimal external dependencies
    - Self-contained execution scope
5. **Minimize task dependencies**: Structure tasks to reduce interdependencies by:
    - Analyzing prerequisite relationships between tasks
    - Creating parallel execution streams where possible
    - Avoiding unnecessary sequential constraints
    - Designing tasks that can proceed without waiting for others
6. **Optimize for concurrent execution**: Design plan structure with:
    - Parallel task streams where possible
    - Clear separation of concerns between tasks
    - Efficient resource utilization patterns
    - Minimal blocking operations between tasks
7. **Use LLM-optimized format**: Structure the plan for optimal LLM consumption with:
    - Clear hierarchical structure with numbered sections
    - Descriptive headings and subheadings
    - Detailed step-by-step breakdowns
    - Consistent formatting and bullet points
    - Cross-references to relevant documentation files
    - Implementation details and technical specifications

### Prompt Creation and Structuring

When instructed to create a prompt, always:

1. **Structure for maximum parallelization**: Design prompts so that as many tasks as possible can be run in parallel
    - Write the plan in a dedicated `.md` file
    - **Store in `.junie/prompts`**: Place prompt files in the `.junie/prompts` directory
2. **Create small, focused tasks**: Break down complex operations into small, independent tasks with:
    - Single responsibility per task
    - Clear input/output requirements
    - Minimal external dependencies
    - Self-contained execution scope
3. **Minimize task dependencies**: Structure tasks to reduce interdependencies by:
    - Identifying which tasks can run independently
    - Grouping dependent tasks into logical sequences
    - Clearly defining data flow between dependent tasks
    - Using shared resources efficiently to avoid conflicts
4. **Optimize for concurrent execution**: Design prompt structure with:
    - Parallel task streams where possible
    - Clear separation of concerns between tasks
    - Efficient resource utilization patterns
    - Minimal blocking operations between tasks


### Project Structure Patterns

#### oRPC Implementation
- **Public procedures**: Located in `src/lib/orpc/public/` - No authentication required
- **Private procedures**: Located in `src/lib/orpc/private/` - Require authentication
- **Middleware**: `src/lib/orpc/middleware/` contains auth, database, and context middleware
- **Contracts**: Define input/output schemas using Zod for type safety

#### Database Patterns
- **Schema files**: Organized by domain in `src/lib/db/schema/`
- **Migrations**: Use `npm run generate` → `npm run local:d1` → `npm run migrate` workflow
- **Integration**: Access via `getDB(ctx)` in Astro Actions, `drizzle(this.env.DB)` in Durable Objects

#### Component Organization
- **SolidJS components**: Interactive UI with client-side reactivity
- **Astro components**: Server-rendered with optional islands architecture
- **Client directives**: Use `client:load`, `client:visible`, `client:idle` strategically
- **Control flow**: Always use SolidJS control flow components (`Show`, `For`, `Index`, `Switch`, `Match`)

### Development Workflow Best Practices

#### Testing Examples
Always test code examples before documenting them:
```bash
# Test database queries
npm run dev
# Test component rendering
# Test oRPC procedure calls
# Test WebSocket connections
```

#### Common Development Commands
```bash
# Database operations
npm run generate    # Generate migrations
npm run migrate     # Apply to remote DB
npm run local:d1    # Apply to local DB

# Development
npm run dev         # Local development
npm run cf:dev      # Cloudflare Workers dev
npm run cf:deploy   # Deploy to production
```

### Important Notes

#### Code Style & Standards
- **TypeScript**: Use strict typing, avoid `any`
- **Error Handling**: Use targeted try-catch blocks, not large catch-all blocks
- **Authentication**: Always validate in both Astro Actions and WebSocket endpoints
- **Database**: Use Drizzle's `and()` utility for multiple where conditions (cannot chain `.where()`)

#### File Management
- **Temporary files**: Always clean up `.tmp/` files after use
- **Git status**: Check `git status` to understand recent changes
- **Documentation updates**: Always update the appropriate documentation in `.junie/docs` when making changes to the codebase
  - When adding oRPC procedures: Update `.junie/docs/orpc/ORPC_README.md` and related files
  - When adding API endpoints: Update `.junie/docs/architecture/ARCHITECTURE_README.md` 
  - When adding database schemas: Update `.junie/docs/database/DATABASE_README.md`
  - When adding components: Update `.junie/docs/ui/UI_README.md` and related files
  - When making significant architectural changes: Update relevant documentation files

#### Performance Considerations
- **Client hydration**: Use appropriate client directives based on component needs
- **Database queries**: Optimize with proper indexing and query patterns
- **WebSocket connections**: Handle connection lifecycle and cleanup properly

## Current Technology Stack

- **Frontend**: Astro + SolidJS with Islands Architecture
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Real-time**: TinyBase + Durable Objects + WebSockets
- **API**: oRPC procedures (contract-first) + Astro Actions
- **Styling**: TailwindCSS with custom design system
- **Auth**: Session-based with OAuth providers (Tiltify, Twitch, YouTube)
- **Deployment**: Cloudflare Workers + Pages

---

*This document focuses on project-specific information. Refer to local documentation in `.junie/docs/` for comprehensive guides on specific domains.*

*Last updated: August 8, 2025*
