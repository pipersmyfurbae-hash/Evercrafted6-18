CREATE TABLE `trustedCheckoutOrigins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`origin` varchar(255) NOT NULL,
	`status` enum('reviewed','disabled') NOT NULL DEFAULT 'disabled',
	`reviewNote` text,
	`reviewedByUserId` int NOT NULL,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trustedCheckoutOrigins_id` PRIMARY KEY(`id`),
	CONSTRAINT `trusted_checkout_origins_origin_unique` UNIQUE(`origin`)
);
--> statement-breakpoint
CREATE TABLE `webhookReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(80) NOT NULL,
	`eventId` varchar(191) NOT NULL,
	`status` enum('received','processed','rejected') NOT NULL DEFAULT 'received',
	`payloadHash` varchar(128) NOT NULL,
	`errorSummary` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookReceipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_receipts_provider_event_unique` UNIQUE(`provider`,`eventId`)
);
--> statement-breakpoint
ALTER TABLE `trustedCheckoutOrigins` ADD CONSTRAINT `trustedCheckoutOrigins_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trusted_checkout_origins_status_index` ON `trustedCheckoutOrigins` (`status`);--> statement-breakpoint
CREATE INDEX `webhook_receipts_status_received_index` ON `webhookReceipts` (`status`,`receivedAt`);