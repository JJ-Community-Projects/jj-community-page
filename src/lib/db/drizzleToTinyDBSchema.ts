import type {SQLiteTableWithColumns} from "drizzle-orm/sqlite-core";
import type {CellSchema, Id} from "tinybase";
import {streamParticipantsTable, streamsTable} from "./schema/schema.ts";
import type {TableConfig} from "drizzle-orm/sqlite-core/table";
import type {TablesSchema} from "tinybase/store";

type Table =  {[cellId: Id]: CellSchema}

function drizzleTableToTinybaseTable<T extends TableConfig>(schema: SQLiteTableWithColumns<T>): Table {
  const table: Table = {}

  // Get all column names from the schema
  const columnNames = Object.keys(schema).filter(key => {
    // Filter out methods and properties that are not columns
    return typeof schema[key] === 'object' && schema[key] !== null && 'name' in schema[key]
  })

  // Map each column to a CellSchema
  for (const columnName of columnNames) {
    const column = schema[columnName]

    // Skip if not a valid column
    if (!column || typeof column !== 'object' || !('dataType' in column)) continue

    // Map Drizzle column types to TinyBase cell types
    if ('dataType' in column) {
      switch (column.dataType) {
        case 'string':
          table[columnName] = { type: 'string' }
          break
        case 'number':
          table[columnName] = { type: 'number' }
          break
        case 'boolean':
          table[columnName] = { type: 'boolean' }
          break
        case 'date':
          // TinyBase doesn't have a date type, so we'll use string
          table[columnName] = { type: 'string' }
          break
        default:
          // Default to string for unknown types
          table[columnName] = { type: 'string' }
      }
    }
  }

  return table
}

function drizzleTablesToTinybaseSchema(...schemas: SQLiteTableWithColumns<any>[]): TablesSchema {
  const schema: TablesSchema = {}

  // Process each table schema
  for (const tableSchema of schemas) {
    // Get the table name from the schema
    if (!tableSchema || typeof tableSchema !== 'object' || !('_' in tableSchema)) continue

    // Extract table name from the schema
    const tableName = tableSchema._.name

    // Convert the table schema to TinyBase format
    const tableDefinition = drizzleTableToTinybaseTable(tableSchema)

    // Add the table to the schema
    schema[tableName] = tableDefinition
  }

  return schema
}

// Test the function with streamParticipantsTable
const streamParticipantsSchema = drizzleTableToTinybaseTable(streamsTable)
console.log('Stream Participants Schema:', streamParticipantsSchema)

// Test the drizzleTablesToTinybaseSchema function with example tables
const tablesSchema = drizzleTablesToTinybaseSchema(streamsTable, streamParticipantsTable)
console.log('Tables Schema:', tablesSchema)

// Export the functions for use in other modules
export { drizzleTableToTinybaseTable, drizzleTablesToTinybaseSchema }
