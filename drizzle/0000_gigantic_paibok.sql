CREATE TABLE `accounts` (
	`userId` integer NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_username` text NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	`meta` text,
	PRIMARY KEY(`userId`, `provider`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_id_unique` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_index_user_id_provider` ON `accounts` (`userId`,`provider`);--> statement-breakpoint
CREATE INDEX `index_user_id` ON `accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `index_provider_id` ON `accounts` (`provider_id`);--> statement-breakpoint
CREATE TABLE `blockedAccounts` (
	`provider_id` text NOT NULL,
	`provider` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `accounts`(`provider_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`userId` integer NOT NULL,
	`provider` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`userId`, `provider`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `userSocials` (
	`userId` integer NOT NULL,
	`social` text NOT NULL,
	`url` text NOT NULL,
	PRIMARY KEY(`userId`, `social`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_url_provider` ON `userSocials` (`userId`,`social`);--> statement-breakpoint
CREATE TABLE `userTags` (
	`userId` integer NOT NULL,
	`tag` text NOT NULL,
	`label` text NOT NULL,
	`added_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`userId`, `tag`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_tag` ON `userTags` (`userId`,`tag`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`role` text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `durable_objects` (
	`namespace` text NOT NULL,
	`id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `durable_objects_pk` ON `durable_objects` (`namespace`,`id`);--> statement-breakpoint
CREATE TABLE `editors` (
	`schedule_id` text,
	`user_id` text,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editors_pk` ON `editors` (`schedule_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`year` integer NOT NULL,
	`visible` integer NOT NULL,
	`owner_id` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
	`added_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	PRIMARY KEY(`schedule_id`, `id`),
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_invites` (
	`team_id` integer NOT NULL,
	`invite_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invite_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `single_invite_per_user_per_team` ON `team_invites` (`team_id`,`invite_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`team_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE UNIQUE INDEX `team_unique_slug` ON `teams` (`team_slug`);