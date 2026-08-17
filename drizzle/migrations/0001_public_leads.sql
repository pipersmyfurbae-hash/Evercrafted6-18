CREATE TABLE IF NOT EXISTS `leads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `name` varchar(160),
  `interest` varchar(120),
  `source` varchar(120) NOT NULL DEFAULT 'website',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `leads_id` PRIMARY KEY(`id`),
  CONSTRAINT `leads_email_unique` UNIQUE(`email`)
);
