PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_jj_campaign` (
	`year` integer NOT NULL,
	`cause_id` text,
	`name` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`url` text,
	`start_time` text NOT NULL,
	`raised` real NOT NULL,
	`goal` real NOT NULL,
	`livestream` text,
	`user_name` text,
	`user_slug` text,
	`user_avatar` text,
	`user_url` text,
	PRIMARY KEY(`user_slug`, `year`)
);
--> statement-breakpoint
INSERT INTO `__new_jj_campaign`("year", "cause_id", "name", "description", "slug", "url", "start_time", "raised", "goal", "livestream", "user_name", "user_slug", "user_avatar", "user_url") SELECT "year", "cause_id", "name", "description", "slug", "url", "start_time", "raised", "goal", "livestream", "user_name", "user_slug", "user_avatar", "user_url" FROM `jj_campaign`;--> statement-breakpoint
DROP TABLE `jj_campaign`;--> statement-breakpoint
ALTER TABLE `__new_jj_campaign` RENAME TO `jj_campaign`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_jj_causes` (
	`year` integer NOT NULL,
	`id` text,
	`name` text NOT NULL,
	`logo` text,
	`description` text,
	`url` text,
	`donate_url` text,
	`raised` numeric,
	PRIMARY KEY(`id`, `year`)
);
--> statement-breakpoint
INSERT INTO `__new_jj_causes`("year", "id", "name", "logo", "description", "url", "donate_url", "raised") SELECT "year", "id", "name", "logo", "description", "url", "donate_url", "raised" FROM `jj_causes`;--> statement-breakpoint
DROP TABLE `jj_causes`;--> statement-breakpoint
ALTER TABLE `__new_jj_causes` RENAME TO `jj_causes`;