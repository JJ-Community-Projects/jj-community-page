CREATE TABLE `accounts` (
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_username` text NOT NULL,
	`created_at` integer DEFAULT ((unixepoch())
                     ) NOT NULL,
	`updated_at` integer DEFAULT ((unixepoch())
                     ) NOT NULL,
	`meta` text,
	PRIMARY KEY(`user_id`, `provider`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_id_unique` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_index_user_id_provider` ON `accounts` (`user_id`,`provider`);--> statement-breakpoint
CREATE INDEX `index_user_id` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `index_provider_id` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE TABLE `blocked_accounts` (
	`provider_id` text NOT NULL,
	`provider` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT ((unixepoch())
                 ) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `accounts`(`provider_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `provider`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_socials` (
	`user_id` integer NOT NULL,
	`social` text NOT NULL,
	`url` text NOT NULL,
	PRIMARY KEY(`user_id`, `social`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_url_provider` ON `user_socials` (`user_id`,`social`);--> statement-breakpoint
CREATE TABLE `user_styles` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`primary_color` text DEFAULT '#E30E50' NOT NULL,
	`accent_color` text DEFAULT '#3584BF' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_tags` (
	`user_id` integer NOT NULL,
	`tag` text NOT NULL,
	`label` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch()
                                                                          ) NOT NULL,
	PRIMARY KEY(`user_id`, `tag`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_tag` ON `user_tags` (`user_id`,`tag`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT ((unixepoch())
                 ) NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`primaryLiveStream` text DEFAULT 'twitch' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `durable_objects` (
	`namespace` text NOT NULL,
	`id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `durable_objects_pk` ON `durable_objects` (`namespace`,`id`);--> statement-breakpoint
CREATE TABLE `editors` (
	`schedule_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editors_pk` ON `editors` (`schedule_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`year` integer NOT NULL,
	`visible` integer NOT NULL,
	`primary` integer DEFAULT false NOT NULL,
	`owner_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()
                                                                                ) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()
                                                                                ) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_slug_unique` ON `schedules` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_schedule_slug` ON `schedules` (`slug`);--> statement-breakpoint
CREATE TABLE `stream_participants` (
	`schedule_id` integer NOT NULL,
	`stream_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`schedule_id`,`stream_id`) REFERENCES `streams`(`schedule_id`,`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stream_participants_pk` ON `stream_participants` (`schedule_id`,`stream_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `stream_tags` (
	`stream_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`tag` text NOT NULL,
	`label` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`schedule_id`, `stream_id`, `tag`),
	FOREIGN KEY (`schedule_id`,`stream_id`) REFERENCES `streams`(`schedule_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`created_by` integer NOT NULL,
	`title` text NOT NULL,
	`visible` integer DEFAULT false NOT NULL,
	`subtitle` text,
	`description` text,
	`youtube_vod_url` text,
	`twitch_vod_url` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	PRIMARY KEY(`schedule_id`, `id`),
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_invites` (
	`team_id` integer NOT NULL,
	`invite_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invite_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `single_invite_per_user_per_team` ON `team_invites` (`team_id`,`invite_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `single_user_per_team` ON `team_members` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`team_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`team_name` text NOT NULL,
	`team_description` text,
	`team_slug` text NOT NULL,
	`team_visibility` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_team_slug_unique` ON `teams` (`team_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_unique_slug` ON `teams` (`team_slug`);--> statement-breakpoint
CREATE TABLE `twitch_channels` (
	`user_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`profile_image_url` text,
	`offline_image_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `twitch_streams` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_login` text NOT NULL,
	`user_name` text NOT NULL,
	`game_id` text,
	`game_name` text,
	`type` text,
	`title` text,
	`viewer_count` integer,
	`started_at` text,
	`language` text,
	`thumbnail_url` text,
	`tag_ids` text,
	`is_mature` integer
);
--> statement-breakpoint
CREATE TABLE `youtube_channel` (
	`user_id` integer,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text,
	`etag` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `youtube_localized` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`title` text,
	`description` text,
	FOREIGN KEY (`channel_id`) REFERENCES `youtube_channel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `youtube_snippet` (
	`channel_id` text PRIMARY KEY NOT NULL,
	`title` text,
	`description` text,
	`customUrl` text,
	`publishedAt` text,
	`country` text,
	FOREIGN KEY (`channel_id`) REFERENCES `youtube_channel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `youtube_thumbnail` (
	`channel_id` text,
	`resolution` text,
	`url` text,
	`width` integer,
	`height` integer,
	PRIMARY KEY(`channel_id`, `resolution`),
	FOREIGN KEY (`channel_id`) REFERENCES `youtube_channel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE VIEW `schedule_ui` AS select "id", json_object(
      'id',        "id",
      'title',     "title",
      'slug',      "slug",
      'year',      "year",
      'visible',   "visible",
      'primary',   "primary",
      'ownerId',   "owner_id",
      'createdAt', "created_at",
      'updatedAt', "updated_at"
    ) as "schedule", (
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
            FROM "stream_tags" AS tag
            WHERE tag.schedule_id = "id"
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
            FROM "stream_participants" AS sp
            JOIN "users"    AS u   ON u.id = sp.user_id
            LEFT JOIN "user_socials" AS soc ON soc.user_id = u.id AND soc.provider = 'tiltify'
            LEFT JOIN "user_tags"    AS ut  ON ut.user_id  = u.id
            LEFT JOIN "user_styles"  AS us  ON us.user_id  = u.id
            WHERE sp.schedule_id = "id"
              AND sp.stream_id   = str.id
          )
        )
      )
      FROM "streams" AS str
      WHERE str.schedule_id = "id"
    ) as "streams" from "schedules";--> statement-breakpoint
CREATE VIEW `social_names_view` AS select "user_id", "social", "url", substr(url, length(url) - instr(reverse(url), '/') + 2) as "name" from "user_socials";--> statement-breakpoint
CREATE VIEW `stream_participants_ui_view` AS select "stream_participants"."stream_id", "stream_participants"."schedule_id", "stream_participants"."user_id", "accounts"."provider_username", "accounts"."provider_id", "accounts"."meta", "user_styles"."primary_color", "user_styles"."accent_color" from "stream_participants" inner join "accounts" on ("stream_participants"."user_id" = "accounts"."user_id" and "accounts"."provider" = 'tiltify') left join "user_styles" on "stream_participants"."user_id" = "user_styles"."user_id";