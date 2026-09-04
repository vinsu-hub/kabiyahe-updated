CREATE TABLE `destinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text,
	`address` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`claimedByPartnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `destinations_id` PRIMARY KEY(`id`),
	CONSTRAINT `destinations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `partnerAdminLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`adminUserId` int NOT NULL,
	`action` enum('approved','rejected','suspended','info_requested','deactivated','claimed') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerAdminLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`metricDate` timestamp NOT NULL,
	`clickThroughCount` int NOT NULL DEFAULT 0,
	`itineraryInclusionCount` int NOT NULL DEFAULT 0,
	`walletSaveCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `partnerMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`url` varchar(800) NOT NULL,
	`mimeType` varchar(80),
	`fileName` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int,
	`businessName` varchar(180) NOT NULL,
	`partnerType` enum('spot','restaurant','hotel','guide') NOT NULL,
	`categories` text,
	`contactName` varchar(160) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(40),
	`businessAddress` text,
	`bookingUrl` varchar(500),
	`description` text,
	`businessPermitNumber` varchar(120),
	`status` enum('pending','active','rejected','info_requested','suspended','deactivated') NOT NULL DEFAULT 'pending',
	`linkedDestinationId` int,
	`visibilityTier` enum('standard','featured') NOT NULL DEFAULT 'standard',
	`rejectionReason` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','partner','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
