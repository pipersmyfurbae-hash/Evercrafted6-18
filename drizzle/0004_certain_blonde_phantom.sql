CREATE TABLE `essenceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`memoryEntryId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','approved','needs_revision') NOT NULL DEFAULT 'draft',
	`emotionalCenter` varchar(255) NOT NULL,
	`atmosphere` varchar(255) NOT NULL,
	`movement` varchar(255) NOT NULL,
	`visualTension` varchar(255) NOT NULL,
	`paletteDirection` varchar(255) NOT NULL,
	`expression` text NOT NULL,
	`avoidances` json NOT NULL,
	`sourceGrounding` json NOT NULL,
	`unsupportedClaims` json NOT NULL,
	`generationSource` enum('manual','model','fallback') NOT NULL DEFAULT 'manual',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `essenceProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `essence_profiles_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `guidedStageStates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`currentStage` enum('memory','essence','story','florals','recipe','blueprint','wreath','outcome') NOT NULL DEFAULT 'memory',
	`status` enum('draft','blocked','complete') NOT NULL DEFAULT 'draft',
	`blockReason` text,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidedStageStates_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_stage_states_project_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `memoryConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`consentType` enum('memory','story','wreath_image','lookbook','marketing','anonymous_improvement') NOT NULL,
	`isGranted` boolean NOT NULL DEFAULT false,
	`visibility` enum('private','private_story_shareable_wreath','private_link_lookbook','anonymous_gallery','public_first_name','fully_public') NOT NULL DEFAULT 'private',
	`decidedByUserId` int NOT NULL,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `memoryConsents_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_consents_project_type_unique` UNIQUE(`projectId`,`consentType`)
);
--> statement-breakpoint
CREATE TABLE `memoryEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`body` text NOT NULL,
	`visibility` enum('private','private_story_shareable_wreath','private_link_lookbook','anonymous_gallery','public_first_name','fully_public') NOT NULL DEFAULT 'private',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoryEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_entries_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `memoryStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`memoryEntryId` int NOT NULL,
	`essenceProfileId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','approved','needs_revision') NOT NULL DEFAULT 'draft',
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`designSignals` json NOT NULL,
	`sourceGrounding` json NOT NULL,
	`unsupportedClaims` json NOT NULL,
	`generationSource` enum('manual','model','fallback') NOT NULL DEFAULT 'manual',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	CONSTRAINT `memoryStories_id` PRIMARY KEY(`id`),
	CONSTRAINT `memory_stories_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `memoryThreadEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stage` enum('memory','essence','story','florals','recipe','blueprint','wreath','outcome') NOT NULL,
	`sourceType` varchar(80) NOT NULL,
	`sourceId` int NOT NULL,
	`sourceVersion` int NOT NULL,
	`summary` text NOT NULL,
	`isDirectSource` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoryThreadEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stageApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stage` enum('memory','essence','story','florals','recipe','blueprint','wreath','outcome') NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int NOT NULL,
	`entityVersion` int NOT NULL,
	`decision` enum('approved','revision_requested') NOT NULL,
	`note` text,
	`decidedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stageApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `essenceProfiles` ADD CONSTRAINT `essenceProfiles_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `essenceProfiles` ADD CONSTRAINT `essenceProfiles_memoryEntryId_memoryEntries_id_fk` FOREIGN KEY (`memoryEntryId`) REFERENCES `memoryEntries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `essenceProfiles` ADD CONSTRAINT `essenceProfiles_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedStageStates` ADD CONSTRAINT `guidedStageStates_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedStageStates` ADD CONSTRAINT `guidedStageStates_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryConsents` ADD CONSTRAINT `memoryConsents_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryConsents` ADD CONSTRAINT `memoryConsents_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryEntries` ADD CONSTRAINT `memoryEntries_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryEntries` ADD CONSTRAINT `memoryEntries_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryStories` ADD CONSTRAINT `memoryStories_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryStories` ADD CONSTRAINT `memoryStories_memoryEntryId_memoryEntries_id_fk` FOREIGN KEY (`memoryEntryId`) REFERENCES `memoryEntries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryStories` ADD CONSTRAINT `memoryStories_essenceProfileId_essenceProfiles_id_fk` FOREIGN KEY (`essenceProfileId`) REFERENCES `essenceProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryStories` ADD CONSTRAINT `memoryStories_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryThreadEvents` ADD CONSTRAINT `memoryThreadEvents_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memoryThreadEvents` ADD CONSTRAINT `memoryThreadEvents_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stageApprovals` ADD CONSTRAINT `stageApprovals_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stageApprovals` ADD CONSTRAINT `stageApprovals_decidedByUserId_users_id_fk` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `essence_profiles_project_status_index` ON `essenceProfiles` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `memory_entries_project_created_index` ON `memoryEntries` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `memory_stories_project_status_index` ON `memoryStories` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `memory_thread_events_project_created_index` ON `memoryThreadEvents` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `stage_approvals_project_stage_index` ON `stageApprovals` (`projectId`,`stage`,`createdAt`);--> statement-breakpoint
CREATE INDEX `stage_approvals_entity_index` ON `stageApprovals` (`entityType`,`entityId`);