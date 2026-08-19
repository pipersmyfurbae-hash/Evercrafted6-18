CREATE TABLE `guidedManualRenderHandoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`renderPackageId` int NOT NULL,
	`status` enum('requested','awaiting_result','stale') NOT NULL DEFAULT 'requested',
	`requestNote` text,
	`requestedByUserId` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`staleReason` text,
	`staleAt` timestamp,
	CONSTRAINT `guidedManualRenderHandoffs_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_manual_handoffs_package_unique` UNIQUE(`renderPackageId`)
);
--> statement-breakpoint
CREATE TABLE `guidedRenderPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`recipeId` int NOT NULL,
	`blueprintId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','approved','stale') NOT NULL DEFAULT 'draft',
	`manifest` json NOT NULL,
	`staleReason` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`staleAt` timestamp,
	CONSTRAINT `guidedRenderPackages_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_render_packages_project_version_unique` UNIQUE(`projectId`,`version`),
	CONSTRAINT `guided_render_packages_blueprint_unique` UNIQUE(`blueprintId`)
);
--> statement-breakpoint
ALTER TABLE `guidedManualRenderHandoffs` ADD CONSTRAINT `guidedManualRenderHandoffs_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedManualRenderHandoffs` ADD CONSTRAINT `guided_render_handoff_package_fk` FOREIGN KEY (`renderPackageId`) REFERENCES `guidedRenderPackages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedManualRenderHandoffs` ADD CONSTRAINT `guidedManualRenderHandoffs_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderPackages` ADD CONSTRAINT `guidedRenderPackages_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderPackages` ADD CONSTRAINT `guidedRenderPackages_recipeId_guidedWreathRecipes_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `guidedWreathRecipes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderPackages` ADD CONSTRAINT `guidedRenderPackages_blueprintId_guidedWreathBlueprints_id_fk` FOREIGN KEY (`blueprintId`) REFERENCES `guidedWreathBlueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderPackages` ADD CONSTRAINT `guidedRenderPackages_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `guided_manual_handoffs_project_status_index` ON `guidedManualRenderHandoffs` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `guided_render_packages_project_status_index` ON `guidedRenderPackages` (`projectId`,`status`);
