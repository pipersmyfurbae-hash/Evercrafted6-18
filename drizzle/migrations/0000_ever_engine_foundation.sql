CREATE TABLE IF NOT EXISTS `organizations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(128) NOT NULL,
  `name` varchar(160) NOT NULL,
  `ownerUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
  CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(128) NOT NULL,
  `name` varchar(160) NOT NULL,
  `kind` enum('personal','organization') NOT NULL,
  `organizationId` int,
  `createdByUserId` int NOT NULL,
  `isArchived` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
  CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaceMemberships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','admin','member','viewer','client') NOT NULL DEFAULT 'member',
  `status` enum('active','invited','suspended') NOT NULL DEFAULT 'active',
  `invitedByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workspaceMemberships_id` PRIMARY KEY(`id`),
  CONSTRAINT `workspace_memberships_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaceInvitations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `role` enum('owner','admin','member','viewer','client') NOT NULL DEFAULT 'member',
  `token` varchar(128) NOT NULL,
  `invitedByUserId` int NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `acceptedAt` timestamp,
  `revokedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `workspaceInvitations_id` PRIMARY KEY(`id`),
  CONSTRAINT `workspace_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `name` varchar(180) NOT NULL,
  `description` text,
  `status` enum('draft','active','in_review','approved','delivered','archived') NOT NULL DEFAULT 'draft',
  `createdByUserId` int NOT NULL,
  `archivedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `projectId` int,
  `name` varchar(255) NOT NULL,
  `mediaType` varchar(128) NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `sizeBytes` int NOT NULL,
  `checksum` varchar(128),
  `status` enum('pending','ready','processing','failed','archived') NOT NULL DEFAULT 'pending',
  `metadata` json,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `assets_id` PRIMARY KEY(`id`),
  CONSTRAINT `assets_workspace_storage_key_unique` UNIQUE(`workspaceId`,`storageKey`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `assetVersions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetId` int NOT NULL,
  `versionNumber` int NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `sizeBytes` int NOT NULL,
  `checksum` varchar(128),
  `changeNote` text,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `assetVersions_id` PRIMARY KEY(`id`),
  CONSTRAINT `asset_versions_asset_version_unique` UNIQUE(`assetId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workflowEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `projectId` int,
  `assetId` int,
  `eventType` varchar(80) NOT NULL,
  `fromStatus` varchar(32),
  `toStatus` varchar(32),
  `note` text,
  `actorUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `workflowEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int,
  `recipientUserId` int NOT NULL,
  `type` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `actionUrl` varchar(512),
  `readAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `backgroundJobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int,
  `jobType` varchar(100) NOT NULL,
  `status` enum('queued','running','succeeded','failed','cancelled') NOT NULL DEFAULT 'queued',
  `idempotencyKey` varchar(128) NOT NULL,
  `payload` json,
  `result` json,
  `errorMessage` text,
  `attempts` int NOT NULL DEFAULT 0,
  `maxAttempts` int NOT NULL DEFAULT 3,
  `progressPercent` int NOT NULL DEFAULT 0,
  `startedAt` timestamp,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `backgroundJobs_id` PRIMARY KEY(`id`),
  CONSTRAINT `background_jobs_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(80) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `plans_id` PRIMARY KEY(`id`),
  CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaceEntitlements` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `planId` int,
  `capability` varchar(120) NOT NULL,
  `isEnabled` boolean NOT NULL DEFAULT true,
  `usageLimit` int,
  `validFrom` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `validUntil` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workspaceEntitlements_id` PRIMARY KEY(`id`),
  CONSTRAINT `workspace_entitlements_capability_unique` UNIQUE(`workspaceId`,`capability`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `featureFlags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `key` varchar(120) NOT NULL,
  `workspaceId` int,
  `isEnabled` boolean NOT NULL DEFAULT false,
  `description` text,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
  CONSTRAINT `feature_flags_workspace_key_unique` UNIQUE(`workspaceId`,`key`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int,
  `actorUserId` int,
  `action` varchar(160) NOT NULL,
  `targetType` varchar(80),
  `targetId` varchar(128),
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `workspaces_organization_index` ON `workspaces` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `workspaces_creator_index` ON `workspaces` (`createdByUserId`);
--> statement-breakpoint
CREATE INDEX `workspace_memberships_user_index` ON `workspaceMemberships` (`userId`);
--> statement-breakpoint
CREATE INDEX `workspace_invitations_workspace_index` ON `workspaceInvitations` (`workspaceId`);
--> statement-breakpoint
CREATE INDEX `workspace_invitations_email_index` ON `workspaceInvitations` (`email`);
--> statement-breakpoint
CREATE INDEX `projects_workspace_status_index` ON `projects` (`workspaceId`,`status`);
--> statement-breakpoint
CREATE INDEX `projects_creator_index` ON `projects` (`createdByUserId`);
--> statement-breakpoint
CREATE INDEX `assets_workspace_index` ON `assets` (`workspaceId`);
--> statement-breakpoint
CREATE INDEX `assets_project_index` ON `assets` (`projectId`);
--> statement-breakpoint
CREATE INDEX `workflow_events_workspace_index` ON `workflowEvents` (`workspaceId`);
--> statement-breakpoint
CREATE INDEX `workflow_events_project_index` ON `workflowEvents` (`projectId`);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_index` ON `notifications` (`recipientUserId`,`readAt`);
--> statement-breakpoint
CREATE INDEX `background_jobs_status_index` ON `backgroundJobs` (`status`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `workspace_entitlements_plan_index` ON `workspaceEntitlements` (`planId`);
--> statement-breakpoint
CREATE INDEX `audit_logs_workspace_created_index` ON `auditLogs` (`workspaceId`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_index` ON `auditLogs` (`actorUserId`,`createdAt`);
