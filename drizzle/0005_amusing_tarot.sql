CREATE TABLE `botanicalReferenceCatalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyKey` varchar(96) NOT NULL,
	`commonName` varchar(160) NOT NULL,
	`category` enum('floral','greenery') NOT NULL,
	`roleHints` json NOT NULL,
	`formCapabilities` json NOT NULL,
	`movementCapabilities` json NOT NULL,
	`surfaceQualities` json NOT NULL,
	`paletteFamilies` json NOT NULL,
	`provenance` enum('reference_fixture','vetted') NOT NULL DEFAULT 'reference_fixture',
	`availabilityStatus` enum('reference_only','verified') NOT NULL DEFAULT 'reference_only',
	`catalogVersion` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `botanicalReferenceCatalog_id` PRIMARY KEY(`id`),
	CONSTRAINT `botanical_reference_catalog_family_unique` UNIQUE(`familyKey`)
);
--> statement-breakpoint
CREATE TABLE `guidedFloralCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleSetId` int NOT NULL,
	`role` enum('PRIMARY_FOCAL','SUPPORTING_FLORAL','DIRECTIONAL_ACCENT','GREENERY_MOVEMENT') NOT NULL,
	`catalogItemId` int NOT NULL,
	`rank` int NOT NULL,
	`explanation` text NOT NULL,
	`matchEvidence` json NOT NULL,
	`tensionNotes` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guidedFloralCandidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_floral_candidates_role_rank_unique` UNIQUE(`roleSetId`,`role`,`rank`)
);
--> statement-breakpoint
CREATE TABLE `guidedFloralCompatibilityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`roleSetId` int NOT NULL,
	`outcome` enum('pass','warning','blocked') NOT NULL DEFAULT 'blocked',
	`checks` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidedFloralCompatibilityReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_floral_compatibility_role_set_unique` UNIQUE(`roleSetId`)
);
--> statement-breakpoint
CREATE TABLE `guidedFloralRoleSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`essenceProfileId` int NOT NULL,
	`memoryStoryId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','complete','stale') NOT NULL DEFAULT 'draft',
	`catalogVersion` varchar(80) NOT NULL,
	`sourceSignals` json NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidedFloralRoleSets_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_floral_role_sets_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `guidedWreathTraySelections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`roleSetId` int NOT NULL,
	`role` enum('PRIMARY_FOCAL','SUPPORTING_FLORAL','DIRECTIONAL_ACCENT','GREENERY_MOVEMENT') NOT NULL,
	`candidateId` int NOT NULL,
	`catalogItemId` int NOT NULL,
	`selectionRationale` text,
	`selectedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidedWreathTraySelections_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_wreath_tray_project_role_unique` UNIQUE(`projectId`,`role`)
);
--> statement-breakpoint
ALTER TABLE `guidedFloralCandidates` ADD CONSTRAINT `gfc_role_set_fk` FOREIGN KEY (`roleSetId`) REFERENCES `guidedFloralRoleSets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralCandidates` ADD CONSTRAINT `gfc_catalog_item_fk` FOREIGN KEY (`catalogItemId`) REFERENCES `botanicalReferenceCatalog`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralCompatibilityReports` ADD CONSTRAINT `gfcr_project_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralCompatibilityReports` ADD CONSTRAINT `gfcr_role_set_fk` FOREIGN KEY (`roleSetId`) REFERENCES `guidedFloralRoleSets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralRoleSets` ADD CONSTRAINT `gfrs_project_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralRoleSets` ADD CONSTRAINT `gfrs_essence_fk` FOREIGN KEY (`essenceProfileId`) REFERENCES `essenceProfiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralRoleSets` ADD CONSTRAINT `gfrs_story_fk` FOREIGN KEY (`memoryStoryId`) REFERENCES `memoryStories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedFloralRoleSets` ADD CONSTRAINT `gfrs_creator_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathTraySelections` ADD CONSTRAINT `gwts_project_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathTraySelections` ADD CONSTRAINT `gwts_role_set_fk` FOREIGN KEY (`roleSetId`) REFERENCES `guidedFloralRoleSets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathTraySelections` ADD CONSTRAINT `gwts_candidate_fk` FOREIGN KEY (`candidateId`) REFERENCES `guidedFloralCandidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathTraySelections` ADD CONSTRAINT `gwts_catalog_fk` FOREIGN KEY (`catalogItemId`) REFERENCES `botanicalReferenceCatalog`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathTraySelections` ADD CONSTRAINT `gwts_selector_fk` FOREIGN KEY (`selectedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `botanical_reference_catalog_category_index` ON `botanicalReferenceCatalog` (`category`);--> statement-breakpoint
CREATE INDEX `guided_floral_candidates_role_set_role_index` ON `guidedFloralCandidates` (`roleSetId`,`role`);--> statement-breakpoint
CREATE INDEX `guided_floral_role_sets_project_status_index` ON `guidedFloralRoleSets` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `guided_wreath_tray_role_set_index` ON `guidedWreathTraySelections` (`roleSetId`);
