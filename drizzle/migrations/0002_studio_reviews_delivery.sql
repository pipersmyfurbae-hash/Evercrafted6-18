CREATE TABLE IF NOT EXISTS `reviewRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `projectId` int NOT NULL,
  `assetId` int,
  `status` enum('pending','approved','changes_requested') NOT NULL DEFAULT 'pending',
  `requestNote` text,
  `responseNote` text,
  `requestedByUserId` int NOT NULL,
  `reviewerUserId` int,
  `respondedByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `respondedAt` timestamp,
  CONSTRAINT `reviewRequests_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `deliveries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `projectId` int NOT NULL,
  `status` enum('draft','ready','published','failed') NOT NULL DEFAULT 'draft',
  `destinationType` varchar(80) NOT NULL,
  `destinationRef` varchar(512),
  `createdByUserId` int NOT NULL,
  `publishedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
CREATE INDEX `review_requests_workspace_project_index` ON `reviewRequests` (`workspaceId`,`projectId`);
CREATE INDEX `review_requests_status_index` ON `reviewRequests` (`status`);
CREATE INDEX `deliveries_workspace_project_index` ON `deliveries` (`workspaceId`,`projectId`);
CREATE INDEX `deliveries_status_index` ON `deliveries` (`status`);
