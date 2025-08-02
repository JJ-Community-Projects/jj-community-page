I have an astro project hosted on cloudflare.
I am using many of cloudflares features like Durable Object, Queues, KV and D1 for the database.
The site allows users to manage their schedules for the charity event called Jingle Jam.
Users can manage their own profile, add tags and socials.
Users can create schedules and teams and invite others to their teams.

I have the following drizzle sqlite schema:

// src/lib/db/auth-schema.ts
import {index, integer, primaryKey, sqliteTable, text, uniqueIndex,} from "drizzle-orm/sqlite-core";
import {sql} from "drizzle-orm";

export const users = sqliteTable("users", {
id: integer({mode: 'number'}).primaryKey({autoIncrement: true}),
createdAt: integer('created_at', {mode: 'timestamp'}).notNull()
.default(sql`((unixepoch())
                 )`),
role: text('role').$type<"user" | "admin">().notNull().default('user'),
primaryLiveStream: text('primaryLiveStream').notNull().default('twitch'), // twitch, youtube, tiktok
});

export const accounts =
sqliteTable("accounts", {
userId: integer('user_id', {mode: 'number'}).notNull()
.references(() => users.id, {onDelete: 'cascade'}),
provider: text('provider').notNull(),
providerId: text('provider_id').notNull().unique(),
providerUsername: text("provider_username").notNull(),
createdAt: integer('created_at', {mode: 'timestamp'})
.default(sql`((unixepoch())
                     )`).notNull(),
updatedAt: integer('updated_at', {mode: 'timestamp'})
.default(sql`((unixepoch())
                     )`).notNull(),
meta: text('meta', {mode: "json"}),
},
(table) => {
return [
primaryKey({
name: 'pk',
columns: [table.userId, table.provider]
}),
uniqueIndex('unique_index_user_id_provider').on(table.userId, table.provider),
index('index_user_id').on(table.userId),
index('index_provider_id').on(table.providerId)
]
}
);

export const tokens = sqliteTable("tokens", {
userId: integer('user_id', {mode: 'number'}).notNull()
.references(() => users.id, {onDelete: 'cascade'}),
provider: text('provider').notNull(),
accessToken: text("access_token").notNull(),
refreshToken: text("refresh_token").notNull(),
expiresAt: integer('expires_at', {mode: 'timestamp'}).notNull(),
},
(table) => {
return [
primaryKey({
name: 'pk',
columns: [table.userId, table.provider]
}),
]
}
)

export const userTags = sqliteTable("user_tags", {
userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
tag: text('tag').notNull(),
label: text('label').notNull(),
addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                          )`),
}, (table) => [
primaryKey({name: 'user_tag_pk', columns: [table.userId, table.tag]}),
uniqueIndex('unique_user_tag').on(table.userId, table.tag)
])

export const userSocials = sqliteTable("user_socials", {
userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
provider: text('social').notNull(), // e.g. twitch, twitter, bsky, etc.
url: text('url').notNull()
}, (table) => [
primaryKey({name: 'user_url_provider_pk', columns: [table.userId, table.provider]}),
uniqueIndex('unique_user_url_provider').on(table.userId, table.provider)
])

export const blockedAccounts = sqliteTable("blocked_accounts", {
providerId: text('provider_id').notNull().notNull().references(() => accounts.providerId, {onDelete: 'cascade'}),
provider: text('provider').notNull(),
reason: text('reason'),
createdAt: integer('created_at', {mode: 'timestamp'})
.default(sql`((unixepoch())
                 )`).notNull(),
})

export const userStyles = sqliteTable("user_styles", {
userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {onDelete: 'cascade'}),
primaryColor: text('primary_color').notNull().default('#E30E50'),
accentColor: text('accent_color').notNull().default('#3584BF'),
}, (table) => [
primaryKey({name: 'user_style_pk', columns: [table.userId]}),
])

// src/lib/db/schema.ts
import {sql} from 'drizzle-orm';
import {foreignKey, integer, primaryKey, sqliteTable, text, uniqueIndex} from 'drizzle-orm/sqlite-core';
import {users} from "./auth-schema.ts";

export const durableObjectsTable = sqliteTable('durable_objects', {
namespace: text('namespace').notNull(),
id: text('id').notNull(),

},
(table) => [
uniqueIndex('durable_objects_pk').on(table.namespace, table.id),
]
)
// integer('timestamp1', { mode: 'timestamp' })
//     .notNull()
//     .default(sql`((unixepoch()))`),
export const schedulesTable = sqliteTable('schedules', {
id: integer().primaryKey({autoIncrement: true}).notNull(),
title: text('title').notNull(),
slug: text('slug').notNull().unique(),
year: integer('year').notNull(),
visible: integer({mode: 'boolean'}).notNull(),
primary: integer({mode: 'boolean'}).notNull().default(false),
ownerId: integer('owner_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
createdAt: integer('created_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                                )`),
updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch()
                                                                                )`),
},
(table) => [
// uniqueIndex('one_schedule_per_year_per_user').on(table.ownerId, table.year),
uniqueIndex('unique_schedule_slug').on(table.slug),
]
);

export const editorsTable = sqliteTable('editors', {
scheduleId: integer('schedule_id').references(() => schedulesTable.id, {onDelete: 'cascade'}).notNull(),
userId: integer('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
},
(table) => [
uniqueIndex('editors_pk').on(table.scheduleId, table.userId),
]
);


export const streamsTable = sqliteTable('streams', {
id: integer('id').notNull(),
scheduleId: integer('schedule_id').references(() => schedulesTable.id, {onDelete: "cascade"}).notNull(),
createdBy: integer('created_by').references(() => users.id).notNull(),
title: text('title').notNull(),
visible: integer({mode: 'boolean'}).notNull().default(false),
subtitle: text('subtitle'),
description: text('description'),
youtubeVodUrl: text('youtube_vod_url'),
twitchVodUrl: text('twitch_vod_url'),
start: integer('start_time', {mode: 'timestamp'}).notNull(),
end: integer('end_time', {mode: 'timestamp'}).notNull(),
},
(table) => [
primaryKey({name: 'pk', columns: [table.scheduleId, table.id]})
]
);

export const streamTagsTable = sqliteTable('stream_tags', {
streamId: integer('stream_id').notNull(),
scheduleId: integer('schedule_id').notNull(),
tag: text('tag').notNull(),
label: text('label').notNull(),
addedAt: integer('added_at', {mode: 'timestamp'}).notNull().default(sql`(unixepoch())`),
},
(table) => [
primaryKey({name: 'stream_tags_pk', columns: [table.scheduleId, table.streamId, table.tag]}),
foreignKey({
name: 'stream_schedule_fk',
columns: [table.scheduleId, table.streamId],
foreignColumns: [streamsTable.scheduleId, streamsTable.id],
}).onDelete('cascade'),
]
)

export const streamParticipantsTable = sqliteTable('stream_participants', {
scheduleId: integer('schedule_id').notNull(),
streamId: integer('stream_id').notNull(),
userId: integer('user_id').notNull(),
}, (table) => [
uniqueIndex('stream_participants_pk').on(table.scheduleId, table.streamId, table.userId),
foreignKey({
name: 'stream_fk',
columns: [table.scheduleId, table.streamId],
foreignColumns: [streamsTable.scheduleId, streamsTable.id],
}).onDelete('cascade'),
foreignKey({
name: 'user_fk',
columns: [table.userId],
foreignColumns: [users.id],
}).onDelete('cascade'),
])


export const teamsTable = sqliteTable('teams', {
id: integer('team_id').primaryKey({autoIncrement: true}).notNull(),
ownerId: integer('owner_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
name: text('team_name').notNull(),
description: text('team_description'),
slug: text('team_slug').notNull().unique(),
visible: integer('team_visibility', {mode: 'boolean'}).notNull().default(false),
},
(table) => [
uniqueIndex('team_unique_slug').on(table.slug),
]
)

export const teamMembersTable = sqliteTable('team_members', {
teamId: integer('team_id').references(() => teamsTable.id, {onDelete: 'cascade'}).notNull(),
userId: integer('user_id').references(() => users.id, {onDelete: 'cascade'}).notNull(),
},
(table) => [
uniqueIndex('single_user_per_team').on(table.teamId, table.userId),
]
)

export const teamInvitesTable = sqliteTable('team_invites', {
teamId: integer('team_id').references(() => teamsTable.id, {onDelete: 'cascade'}).notNull(),
invitedUserId: integer('invite_id').references(() => users.id).notNull(),
},
(table) => [
uniqueIndex('single_invite_per_user_per_team').on(table.teamId, table.invitedUserId),
]
)
// src/lib/db/schema/twitch-channel-schema.ts
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {users} from "./auth-schema.ts";

export const twitchChannelSchema = sqliteTable('twitch_channels', {
userId: integer('user_id', {mode: 'number'}).notNull().references(() => users.id, {
onDelete: 'cascade'
}),
id: text('id').primaryKey(),
login: text('login').notNull(),
displayName: text('display_name').notNull(),
description: text('description'),
profileImageUrl: text('profile_image_url'),
offlineImageUrl: text('offline_image_url'),
})

export const twitchStreamSchema = sqliteTable('twitch_streams', {
id: text('id').primaryKey(),
userId: text('user_id').notNull(),
userLogin: text('user_login').notNull(),
userName: text('user_name').notNull(),
gameId: text('game_id'),
gameName: text('game_name'),
type: text('type'),
title: text('title'),
viewerCount: integer('viewer_count', { mode: 'number' }),
startedAt: text('started_at'),
language: text('language'),
thumbnailUrl: text('thumbnail_url'),
tagIds: text('tag_ids'),
isMature: integer('is_mature', { mode: 'boolean' }),
})


Users sign up using tiltify oauth, which creates a user and a account entry.
Users can add tags and socials to their account.
When a user adds a twitch social, we automatically grab the url, parse the name and fetch the twitch user data using that name.
Once we have that name, we regularly check if the user is live on twitch and write the data into the db as well.
In the future, we will expand this to youtube live streams too.

Now we are in the process of designing the UI and special api endpoints which return already formated json data.
We have the following pages
- /users
  - shows a list of all users with their live status
- /users/[slug]
  - show the page of a user
  - shows their socials
  - shows the next 3 streams of a user
  - shows their schedules
  - shows if they are live on a channel
  - show related users (same team, similar tags)
- /teams
  - show a list of all teams
- /teams/[slug]
  - shows the page of a team
  - shows the members
  - shows if a members are live
  - shows the members schedules
  - shows a combined schedule with the next planed streams of all members
- /schedule/[slug]
  - show a schedule of a user
  - shows the next 3 streams at the top
  - shows a list of the next streams grouped by days below


We have the following requirements
- API endpoints should be reusable,
- If an API endpoint provides data to show on the frontend, it already has to be formated in a way so that the frontend has to do as little transformation as possible.
- When possible, data should be cached using cloudflare KV.
- Time-sensitive data like schedules which might change, and the live status of a user and their channel have to update as soon as possible after the data has changed on the backend.

Your tasks and requirements are:
- Focus on GET endpoints
- Determine, which API endpoints are needed.
- Explain which page has to call which API.
- Explain if page-specific endpoints can help, and if so design them.
- Which DB operations are needed? 
- How and when should realtime data using Websockets be used?
- Use Astro's Action API and Drizzle ORM.
- Design the Data structure needed for the frontends.
- Go through the schema and suggest views which might reduce complex queries.
