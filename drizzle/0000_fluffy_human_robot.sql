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
CREATE TABLE `blocked_users` (
	`user_id` integer NOT NULL,
	`blocked_user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_blocked_user` ON `blocked_users` (`user_id`,`blocked_user_id`);--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`from_user_id` integer NOT NULL,
	`to_user_id` integer NOT NULL,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_friend_requests` ON `friend_requests` (`from_user_id`,`to_user_id`);--> statement-breakpoint
CREATE TABLE `friends` (
	`from_user_id` integer NOT NULL,
	`to_user_id` integer NOT NULL,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_friends` ON `friends` (`from_user_id`,`to_user_id`);--> statement-breakpoint
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
CREATE TABLE `stream_tags` (
	`stream_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`schedule_id`, `stream_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`,`stream_id`) REFERENCES `streams`(`schedule_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stream_tags_tag_id` ON `stream_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_tags_stream` ON `stream_tags` (`schedule_id`,`stream_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_tags_schedule` ON `stream_tags` (`schedule_id`);--> statement-breakpoint
CREATE TABLE `tag_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_id` integer NOT NULL,
	`alias` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_tag_alias` ON `tag_aliases` (`alias`);--> statement-breakpoint
CREATE INDEX `idx_tag_aliases_tag_id` ON `tag_aliases` (`tag_id`);--> statement-breakpoint
CREATE TABLE `tag_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6B7280' NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_categories_slug_unique` ON `tag_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_category_slug` ON `tag_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_categories_visible` ON `tag_categories` (`visible`);--> statement-breakpoint
CREATE INDEX `idx_categories_sort_order` ON `tag_categories` (`sort_order`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`category_id` integer,
	`color` text DEFAULT '#3584BF' NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `tag_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_tag_slug` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tags_category` ON `tags` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_tags_visible` ON `tags` (`visible`);--> statement-breakpoint
CREATE INDEX `idx_tags_created_by` ON `tags` (`created_by`);--> statement-breakpoint
CREATE TABLE `user_tags` (
	`user_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `tag_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_tag` ON `user_tags` (`user_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_user_tags_tag_id` ON `user_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `idx_user_tags_user_id` ON `user_tags` (`user_id`);--> statement-breakpoint
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
CREATE TABLE `edit_schedules` (
	`schedule_id` integer NOT NULL,
	`editor_id` integer NOT NULL,
	`title` text,
	`slug` text,
	`year` integer,
	`visible` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `edit_schedules_unique_schedule` ON `edit_schedules` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `edit_schedules_editor_idx` ON `edit_schedules` (`editor_id`);--> statement-breakpoint
CREATE TABLE `edit_streams` (
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
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`schedule_id`, `id`),
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `edit_streams_schedule_idx` ON `edit_streams` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `edit_streams_start_idx` ON `edit_streams` (`start_time`);--> statement-breakpoint
CREATE TABLE `edit_stream_tags` (
	`stream_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`schedule_id`, `stream_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`,`stream_id`) REFERENCES `edit_streams`(`schedule_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `edit_stream_tags_tag_idx` ON `edit_stream_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `edit_stream_tags_stream_idx` ON `edit_stream_tags` (`schedule_id`,`stream_id`);--> statement-breakpoint
CREATE TABLE `edit_stream_participants` (
	`stream_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`schedule_id`, `stream_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`,`stream_id`) REFERENCES `edit_streams`(`schedule_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `edit_stream_participants_user_idx` ON `edit_stream_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `edit_stream_participants_stream_idx` ON `edit_stream_participants` (`schedule_id`,`stream_id`);--> statement-breakpoint
CREATE VIEW `full_users` AS select "users"."id", "users"."created_at", "users"."role", "users"."primaryLiveStream", "id", "username", "avatar_src", "description", "slug", "twitch_channels"."user_id", "twitch_channels"."id", "twitch_channels"."login", "twitch_channels"."display_name", "twitch_channels"."description", "twitch_channels"."profile_image_url", "twitch_channels"."offline_image_url" from "users" inner join "tiltify_metadata_view" on "users"."id" = "tiltify_metadata_view"."user_id" left join "twitch_channels" on "users"."id" = "twitch_channels"."user_id";--> statement-breakpoint
CREATE VIEW `social_names_view` AS select "user_id", "social", "url", substr(url, length(url) - instr(reverse(url), '/') + 2) as "name" from "user_socials";--> statement-breakpoint
CREATE VIEW `stream_participants_display_view` AS select "stream_participants"."stream_id", "stream_participants"."schedule_id", "stream_participants"."user_id", "username", "profile_image" from "stream_participants" inner join "user_display_view" on "stream_participants"."user_id" = "user_display_view"."id";--> statement-breakpoint
CREATE VIEW `stream_participants_ui_view` AS select "stream_participants"."stream_id", "stream_participants"."schedule_id", "stream_participants"."user_id", "accounts"."provider_username", "accounts"."provider_id", "accounts"."meta", "user_styles"."primary_color", "user_styles"."accent_color" from "stream_participants" inner join "accounts" on ("stream_participants"."user_id" = "accounts"."user_id" and "accounts"."provider" = 'tiltify') left join "user_styles" on "stream_participants"."user_id" = "user_styles"."user_id";--> statement-breakpoint
CREATE VIEW `tiltify_accounts` AS select "user_id", "provider", "provider_id", "provider_username", "created_at", "updated_at", "meta" from "accounts" where "accounts"."provider" = 'tiltify';--> statement-breakpoint
CREATE VIEW `tiltify_metadata_view` AS select "user_id", json_extract("meta", '$.avatar.src') as "avatar_src", json_extract("meta", '$.description') as "description", json_extract("meta", '$.id') as "id", json_extract("meta", '$.slug') as "slug", json_extract("meta", '$.url') as "url", json_extract("meta", '$.username') as "username" from "accounts" where "accounts"."provider" = 'tiltify';--> statement-breakpoint
CREATE VIEW `user_display_view` AS select "users"."id", "users"."primaryLiveStream", "users"."role", "users"."created_at", CASE 
        WHEN "users"."primaryLiveStream" = 'twitch' AND "twitch_channels"."display_name" IS NOT NULL 
        THEN "twitch_channels"."display_name" 
        ELSE "username" 
      END as "username", CASE 
        WHEN "users"."primaryLiveStream" = 'twitch' AND "twitch_channels"."profile_image_url" IS NOT NULL 
        THEN "twitch_channels"."profile_image_url" 
        ELSE "avatar_src" 
      END as "profile_image", "twitch_channels"."login", "slug", "url", "user_styles"."primary_color", "user_styles"."accent_color" from "users" inner join "tiltify_metadata_view" on "users"."id" = "tiltify_metadata_view"."user_id" left join "twitch_channels" on "users"."id" = "twitch_channels"."user_id" left join "user_styles" on "users"."id" = "user_styles"."user_id";--> statement-breakpoint
CREATE VIEW `users_search_view` AS select "users"."id", lower("username") as "tiltifyUsername", lower("twitch_channels"."display_name") as "twitchUsername" from "users" inner join "tiltify_metadata_view" on "users"."id" = "tiltify_metadata_view"."user_id" left join "twitch_channels" on "users"."id" = "twitch_channels"."user_id";