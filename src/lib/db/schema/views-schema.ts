/** example: sqlite view
 export const user = sqliteTable("user", {
 id: integer().primaryKey({autoIncrement: true}),
 name: text(),
 email: text(),
 password: text(),
 role: text().$type<"admin" | "customer">(),
 createdAt: integer("created_at"),
 updatedAt: integer("updated_at"),
 });
 export const userView = sqliteView("user_view").as((qb) => qb.select().from(user));
 export const customersView = sqliteView("customers_view").as((qb) => qb.select().from(user).where(eq(user.role, "customer")));
 */

import { sqliteView } from "drizzle-orm/sqlite-core";
import {schedulesTable, streamParticipantsTable, streamsTable, streamTagsTable} from "./jj-schema";
import {accounts, users, userSocials, userStyles, userTags} from "./auth-schema";
import {and, eq, sql, jaccardDistance, } from "drizzle-orm";


export const streamParticipantsUIView = sqliteView('stream_participants_ui_view')
  .as((qb) => {
    return qb
      .select({
        streamId: streamParticipantsTable.streamId,
        scheduleId: streamParticipantsTable.scheduleId,
        userId: streamParticipantsTable.userId,
        tiltifyName: accounts.providerUsername,
        providerId: accounts.providerId,
        meta: accounts.meta,
        primaryColor: userStyles.primaryColor,
        accentColor: userStyles.accentColor
      })
      .from(streamParticipantsTable)
      .innerJoin(
        accounts,
        and(
          eq(streamParticipantsTable.userId, accounts.userId),
          eq(accounts.provider, 'tiltify')
        )
      )
      .leftJoin(
        userStyles,
        eq(streamParticipantsTable.userId, userStyles.userId)
      );
  });



/**
 * A view returning one row per schedule, with:
 *  - `schedule`: JSON object of the Schedule base
 *  - `streams`: JSON array of DetailedStream (includes tags & participants)
 */
export const scheduleUiView = sqliteView(
  'schedule_ui'
).as((qb) =>
  qb.select({
    id: schedulesTable.id,
    schedule: sql`json_object(
      'id',        ${schedulesTable.id},
      'title',     ${schedulesTable.title},
      'slug',      ${schedulesTable.slug},
      'year',      ${schedulesTable.year},
      'visible',   ${schedulesTable.visible},
      'primary',   ${schedulesTable.primary},
      'ownerId',   ${schedulesTable.ownerId},
      'createdAt', ${schedulesTable.createdAt},
      'updatedAt', ${schedulesTable.updatedAt}
    )`.as('schedule'),

    streams: sql`(
      SELECT json_group_array(
        json_object(
          'id',    str.id,
          'scheduleId', str.schedule_id,
          'title', str.title,
          'subtitle', str.subtitle,
          'description', str.description,
          'youtubeVodUrl', str.youtube_vod_url,
          'twitchVodUrl', str.twitch_vod_url,
          'start', str.start_time,
          'end',   str.end_time,
          'visible', str.visible,
          'createdBy', str.created_by,

          'tags', (
            SELECT json_group_array(
              json_object('tag', tag.tag, 'label', tag.label)
            )
            FROM ${streamTagsTable} AS tag
            WHERE tag.schedule_id = ${schedulesTable.id}
              AND tag.stream_id    = str.id
          ),

          'participants', (
            SELECT json_group_array(
              json_object(
                'id', u.id,
                'tiltifyName', COALESCE(soc.url, ''),
                'label', COALESCE(ut.label, ''),
                'img', NULL,
                'style', json_object(
                  'primaryColor', us.primary_color,
                  'accentColor', us.accent_color
                )
              )
            )
            FROM ${streamParticipantsTable} AS sp
            JOIN ${users}    AS u   ON u.id = sp.user_id
            LEFT JOIN ${userSocials} AS soc ON soc.user_id = u.id AND soc.provider = 'tiltify'
            LEFT JOIN ${userTags}    AS ut  ON ut.user_id  = u.id
            LEFT JOIN ${userStyles}  AS us  ON us.user_id  = u.id
            WHERE sp.schedule_id = ${schedulesTable.id}
              AND sp.stream_id   = str.id
          )
        )
      )
      FROM ${streamsTable} AS str
      WHERE str.schedule_id = ${schedulesTable.id}
    )`.as('streams'),
  })
    .from(schedulesTable)
);

export const socialNames = sqliteView('social_names_view')
  .as((qb) => {
    return qb.select({
      userId: userSocials.userId,
      provider: userSocials.provider,
      url: userSocials.url,
      name: sql`substr(url, length(url) - instr(reverse(url), '/') + 2)`.as('name')
    })
      .from(userSocials)
  })
