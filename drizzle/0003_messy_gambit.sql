CREATE TABLE `platformIntegrationControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationKey` varchar(80) NOT NULL,
	`status` enum('unconfigured','reviewed','ready','disabled') NOT NULL DEFAULT 'unconfigured',
	`isEnabled` boolean NOT NULL DEFAULT false,
	`reviewNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformIntegrationControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_integration_control_key_unique` UNIQUE(`integrationKey`)
);
--> statement-breakpoint
ALTER TABLE `platformIntegrationControls` ADD CONSTRAINT `platformIntegrationControls_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;