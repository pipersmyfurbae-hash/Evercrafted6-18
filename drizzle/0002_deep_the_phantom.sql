CREATE TABLE `workspaceSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trialing','active','past_due','paused','canceled','expired') NOT NULL DEFAULT 'trialing',
	`provider` varchar(80),
	`providerSubscriptionId` varchar(191),
	`currentPeriodStart` timestamp NOT NULL DEFAULT (now()),
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_subscriptions_provider_identifier_unique` UNIQUE(`provider`,`providerSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `workspaceUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`metric` varchar(120) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_usage_metric_period_unique` UNIQUE(`workspaceId`,`metric`,`periodStart`)
);
--> statement-breakpoint
ALTER TABLE `workspaceSubscriptions` ADD CONSTRAINT `workspaceSubscriptions_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceSubscriptions` ADD CONSTRAINT `workspaceSubscriptions_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceUsage` ADD CONSTRAINT `workspaceUsage_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `workspace_subscriptions_workspace_status_index` ON `workspaceSubscriptions` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `workspace_subscriptions_plan_index` ON `workspaceSubscriptions` (`planId`);--> statement-breakpoint
CREATE INDEX `workspace_usage_workspace_period_index` ON `workspaceUsage` (`workspaceId`,`periodStart`);