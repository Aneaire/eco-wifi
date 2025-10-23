CREATE TABLE `bottles` (
	`id` integer PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`material_confirmed` integer DEFAULT false,
	`mac_address` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`total_bottles` integer DEFAULT 0,
	`total_sessions` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stats_date_unique` ON `stats` (`date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`mac_address` text NOT NULL,
	`session_start` text,
	`session_end` text,
	`bottles_deposited` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_mac_address_unique` ON `users` (`mac_address`);