DROP INDEX `unique_index_user_id_provider`;--> statement-breakpoint
DROP INDEX `index_user_id`;--> statement-breakpoint
DROP INDEX `index_provider_id`;--> statement-breakpoint
ALTER TABLE `accounts` ADD `tiltify_slug` text GENERATED ALWAYS AS (json_extract(meta, '$.slug')) VIRTUAL;--> statement-breakpoint
CREATE INDEX `idx_accounts_tiltify_slug` ON `accounts` (`tiltify_slug`) WHERE provider = 'tiltify';--> statement-breakpoint
CREATE INDEX `idx_accounts_username_lower` ON `accounts` (lower(provider_username));--> statement-breakpoint
DROP INDEX `unique_user_url_provider`;--> statement-breakpoint
DROP INDEX `unique_schedule_slug`;--> statement-breakpoint
CREATE INDEX `idx_schedules_owner_year_primary_visible` ON `schedules` (`owner_id`,`year`,`primary`,`visible`);--> statement-breakpoint
CREATE INDEX `idx_schedules_year_primary_visible` ON `schedules` (`year`,`primary`,`visible`);--> statement-breakpoint
DROP INDEX `team_unique_slug`;--> statement-breakpoint
CREATE INDEX `idx_teams_owner` ON `teams` (`owner_id`);--> statement-breakpoint
DROP INDEX `idx_stream_tags_stream`;--> statement-breakpoint
DROP INDEX `idx_stream_tags_schedule`;--> statement-breakpoint
DROP INDEX `unique_category_slug`;--> statement-breakpoint
DROP INDEX `unique_tag_slug`;--> statement-breakpoint
DROP INDEX `unique_user_tag`;--> statement-breakpoint
DROP INDEX `idx_user_tags_user_id`;--> statement-breakpoint
DROP INDEX `edit_streams_schedule_idx`;--> statement-breakpoint
DROP INDEX `edit_stream_tags_stream_idx`;--> statement-breakpoint
DROP INDEX `edit_stream_participants_stream_idx`;--> statement-breakpoint
CREATE INDEX `idx_blocked_users_blocked` ON `blocked_users` (`blocked_user_id`);--> statement-breakpoint
CREATE INDEX `idx_friend_requests_to` ON `friend_requests` (`to_user_id`);--> statement-breakpoint
CREATE INDEX `idx_stream_participants_user` ON `stream_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_team_invites_invite` ON `team_invites` (`invite_id`);--> statement-breakpoint
CREATE INDEX `idx_team_members_user` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_twitch_channels_user_id` ON `twitch_channels` (`user_id`);--> statement-breakpoint
DROP VIEW `tiltify_metadata_view`;--> statement-breakpoint
CREATE VIEW `tiltify_metadata_view` AS select "user_id", json_extract("meta", '$.avatar.src') as "avatar_src", json_extract("meta", '$.description') as "description", json_extract("meta", '$.id') as "id", "tiltify_slug" as "slug", json_extract("meta", '$.url') as "url", json_extract("meta", '$.username') as "username" from "accounts" where "accounts"."provider" = 'tiltify';