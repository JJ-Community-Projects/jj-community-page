// src/lib/db/schema/views-schema.ts
import {sqliteView} from "drizzle-orm/sqlite-core";
import {streamParticipantsTable} from "./jj-schema";
import {accounts, users, userSocials, userStyles} from "./auth-schema";
import {and, eq, sql,} from "drizzle-orm";
import {twitchChannelSchema} from "./twitch-channel-schema.ts";


/**
 * Tiltify accounts view that filters accounts to show only those from the Tiltify provider.
 * Used for accessing Tiltify-specific account information.
 */
export const tiltifyAccountsView = sqliteView('tiltify_accounts')
  .as((qb)=>{
    return qb.select().from(accounts).where(eq(accounts.provider, 'tiltify'))
  })

/**
 * View that extracts Tiltify metadata from the accounts table
 * The meta field contains TiltifyUserData
 */
export const tiltifyMetadataView = sqliteView('tiltify_metadata_view')
  .as((qb) => {
    return qb.select({
      userId: accounts.userId,
      // Avatar
      avatarSrc: sql<string>`json_extract(${accounts.meta}, '$.avatar.src')`.as('avatar_src'),
      // avatarAlt: sql<string>`json_extract(${accounts.meta}, '$.avatar.alt')`.as('avatar_alt'),
      // Basic info
      description: sql<string>`json_extract(${accounts.meta}, '$.description')`.as('description'),
      id: sql<string>`json_extract(${accounts.meta}, '$.id')`.as('id'),
      // legacyId: sql`json_extract(${accounts.meta}, '$.legacy_id')`.as('legacy_id'),
      slug: sql<string>`json_extract(${accounts.meta}, '$.slug')`.as('slug'),
      url: sql<string>`json_extract(${accounts.meta}, '$.url')`.as('url'),
      username: sql<string>`json_extract(${accounts.meta}, '$.username')`.as('username'),
      // Social links
      /*
      socialDiscord: sql`json_extract(${accounts.meta}, '$.social.discord')`.as('social_discord'),
      socialFacebook: sql`json_extract(${accounts.meta}, '$.social.facebook')`.as('social_facebook'),
      socialInstagram: sql`json_extract(${accounts.meta}, '$.social.instagram')`.as('social_instagram'),
      socialSnapchat: sql`json_extract(${accounts.meta}, '$.social.snapchat')`.as('social_snapchat'),
      socialTiktok: sql`json_extract(${accounts.meta}, '$.social.tiktok')`.as('social_tiktok'),
      socialTwitch: sql`json_extract(${accounts.meta}, '$.social.twitch')`.as('social_twitch'),
      socialTwitter: sql`json_extract(${accounts.meta}, '$.social.twitter')`.as('social_twitter'),
      socialWebsite: sql`json_extract(${accounts.meta}, '$.social.website')`.as('social_website'),
      socialYoutube: sql`json_extract(${accounts.meta}, '$.social.youtube')`.as('social_youtube'),
      */
      // Total amount raised
      // totalAmountRaisedCurrency: sql`json_extract(${accounts.meta}, '$.total_amount_raised.currency')`.as('total_amount_raised_currency'),
      // totalAmountRaisedValue: sql`json_extract(${accounts.meta}, '$.total_amount_raised.value')`.as('total_amount_raised_value'),
      // Raw meta data for full access
      // meta: accounts.meta,
    })
      .from(accounts)
      .where(eq(accounts.provider, 'tiltify'))
  })

/**
 * Full users view that combines user data with their Tiltify and Twitch information.
 * Provides a comprehensive view of user profiles across multiple platforms.
 * Used for displaying complete user information in the UI.
 */
export const fullUsersView = sqliteView('full_users')
  .as((qb)=>{
    return qb.select({
      user: users,
      tiltify: {
        id: tiltifyMetadataView.id,
        username: tiltifyMetadataView.username,
        avatarSrc: tiltifyMetadataView.avatarSrc,
        description: tiltifyMetadataView.description,
        slug: tiltifyMetadataView.slug,
      },
      twitch: twitchChannelSchema,
    })
      .from(users)
      .innerJoin(tiltifyMetadataView, and(eq(users.id, tiltifyMetadataView.userId)))
      .leftJoin(twitchChannelSchema, eq(users.id, twitchChannelSchema.userId))
  })

/**
 * User display view that combines user data with display information from multiple sources.
 * Intelligently selects the appropriate username and profile image based on user preferences.
 * Used for consistent user display across the platform UI.
 */
export const userDisplayView = sqliteView('user_display_view')
  .as((qb)=>{
    return qb.select({
      userId: users.id,
      primaryLiveStream: users.primaryLiveStream,
      role: users.role,
      createdAt: users.createdAt,
      username: sql<string>`CASE 
        WHEN ${users.primaryLiveStream} = 'twitch' AND ${twitchChannelSchema.displayName} IS NOT NULL 
        THEN ${twitchChannelSchema.displayName} 
        ELSE ${tiltifyMetadataView.username} 
      END`.as('username'),
      profileImage: sql<string>`CASE 
        WHEN ${users.primaryLiveStream} = 'twitch' AND ${twitchChannelSchema.profileImageUrl} IS NOT NULL 
        THEN ${twitchChannelSchema.profileImageUrl} 
        ELSE ${tiltifyMetadataView.avatarSrc} 
      END`.as('profile_image'),
      twitchLogin: twitchChannelSchema.login,
      tiltifySlug: tiltifyMetadataView.slug,
      tiltifyUrl: tiltifyMetadataView.url,
      primaryColor: userStyles.primaryColor,
      accentColor: userStyles.accentColor,
    })
      .from(users)
      .innerJoin(tiltifyMetadataView, and(eq(users.id, tiltifyMetadataView.userId)))
      .leftJoin(twitchChannelSchema, eq(users.id, twitchChannelSchema.userId))
      .leftJoin(userStyles, eq(users.id, userStyles.userId))
  })


/**
 * Users search view that provides optimized data for user search functionality.
 * Contains lowercase usernames from both Tiltify and Twitch for case-insensitive searching.
 * Used for implementing user search features across the platform.
 */
export const usersSearchView = sqliteView('users_search_view')
  .as((qb)=>{
    return qb.select({
      userId: users.id,
      tiltifyUsername: sql<string>`lower(${tiltifyMetadataView.username})`.as("tiltifyUsername"),
      twitchUsername: sql<string>`lower(${twitchChannelSchema.displayName})`.as("twitchUsername"),
    })
      .from(users)
      .innerJoin(tiltifyMetadataView, and(eq(users.id, tiltifyMetadataView.userId)))
      .leftJoin(twitchChannelSchema, eq(users.id, twitchChannelSchema.userId))
  })

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

/**
 * A view that combines stream participants with user display information.
 * Includes only stream id, schedule id, user id, username, and profile image.
 */
export const streamParticipantsDisplayView = sqliteView('stream_participants_display_view')
  .as((qb) => {
    return qb
      .select({
        streamId: streamParticipantsTable.streamId,
        scheduleId: streamParticipantsTable.scheduleId,
        userId: streamParticipantsTable.userId,
        username: userDisplayView.username,
        profileImage: userDisplayView.profileImage,
      })
      .from(streamParticipantsTable)
      .innerJoin(
        userDisplayView,
        eq(streamParticipantsTable.userId, userDisplayView.userId)
      );
  });
