CREATE TABLE `guidedRenderRevisionRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`renderPackageId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('requested','stale') NOT NULL DEFAULT 'requested',
	`reason` text NOT NULL,
	`requestedByUserId` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`staleReason` text,
	`staleAt` timestamp,
	CONSTRAINT `guidedRenderRevisionRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_render_revision_project_version_unique` UNIQUE(`projectId`,`version`),
	CONSTRAINT `guided_render_revision_package_unique` UNIQUE(`renderPackageId`)
);
--> statement-breakpoint
ALTER TABLE `guidedRenderRevisionRequests` ADD CONSTRAINT `guidedRenderRevisionRequests_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderRevisionRequests` ADD CONSTRAINT `guided_render_revision_package_fk` FOREIGN KEY (`renderPackageId`) REFERENCES `guidedRenderPackages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedRenderRevisionRequests` ADD CONSTRAINT `guidedRenderRevisionRequests_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `guided_render_revision_project_status_index` ON `guidedRenderRevisionRequests` (`projectId`,`status`);
