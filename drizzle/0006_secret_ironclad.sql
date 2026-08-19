CREATE TABLE `guidedWreathBlueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`recipeId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('ready','stale') NOT NULL DEFAULT 'ready',
	`hierarchy` json NOT NULL,
	`derivationNotes` json NOT NULL,
	`staleReason` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`staleAt` timestamp,
	CONSTRAINT `guidedWreathBlueprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_wreath_blueprints_project_version_unique` UNIQUE(`projectId`,`version`),
	CONSTRAINT `guided_wreath_blueprints_recipe_unique` UNIQUE(`recipeId`)
);
--> statement-breakpoint
CREATE TABLE `guidedWreathRecipeItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`role` enum('PRIMARY_FOCAL','SUPPORTING_FLORAL','DIRECTIONAL_ACCENT','GREENERY_MOVEMENT') NOT NULL,
	`candidateId` int NOT NULL,
	`catalogItemId` int NOT NULL,
	`familyKeySnapshot` varchar(96) NOT NULL,
	`commonNameSnapshot` varchar(160) NOT NULL,
	`selectionRationaleSnapshot` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guidedWreathRecipeItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_recipe_items_recipe_role_unique` UNIQUE(`recipeId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `guidedWreathRecipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`roleSetId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('locked','stale') NOT NULL DEFAULT 'locked',
	`compatibilitySnapshot` json NOT NULL,
	`staleReason` text,
	`lockedByUserId` int NOT NULL,
	`lockedAt` timestamp NOT NULL DEFAULT (now()),
	`staleAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guidedWreathRecipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `guided_wreath_recipes_project_version_unique` UNIQUE(`projectId`,`version`)
);
--> statement-breakpoint
ALTER TABLE `guidedWreathBlueprints` ADD CONSTRAINT `guidedWreathBlueprints_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathBlueprints` ADD CONSTRAINT `guidedWreathBlueprints_recipeId_guidedWreathRecipes_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `guidedWreathRecipes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathBlueprints` ADD CONSTRAINT `guidedWreathBlueprints_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipeItems` ADD CONSTRAINT `guidedWreathRecipeItems_recipeId_guidedWreathRecipes_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `guidedWreathRecipes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipeItems` ADD CONSTRAINT `guidedWreathRecipeItems_candidateId_guidedFloralCandidates_id_fk` FOREIGN KEY (`candidateId`) REFERENCES `guidedFloralCandidates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipeItems` ADD CONSTRAINT `guided_recipe_items_catalog_fk` FOREIGN KEY (`catalogItemId`) REFERENCES `botanicalReferenceCatalog`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipes` ADD CONSTRAINT `guidedWreathRecipes_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipes` ADD CONSTRAINT `guidedWreathRecipes_roleSetId_guidedFloralRoleSets_id_fk` FOREIGN KEY (`roleSetId`) REFERENCES `guidedFloralRoleSets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guidedWreathRecipes` ADD CONSTRAINT `guidedWreathRecipes_lockedByUserId_users_id_fk` FOREIGN KEY (`lockedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `guided_wreath_blueprints_project_status_index` ON `guidedWreathBlueprints` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `guided_recipe_items_recipe_index` ON `guidedWreathRecipeItems` (`recipeId`);--> statement-breakpoint
CREATE INDEX `guided_wreath_recipes_project_status_index` ON `guidedWreathRecipes` (`projectId`,`status`);
