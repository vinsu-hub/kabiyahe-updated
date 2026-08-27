CREATE TABLE `feedPostNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedPostId` int NOT NULL,
	`userId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedPostNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('popup','live_event','promo','cultural','alert') NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text NOT NULL,
	`coverPhoto` varchar(800),
	`destinationId` int,
	`partnerId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`outboundLink` varchar(800),
	`source` enum('admin','partner','tourism_council') NOT NULL DEFAULT 'admin',
	`status` enum('pending_review','live','archived','rejected') NOT NULL DEFAULT 'pending_review',
	`boosted` int NOT NULL DEFAULT 0,
	`boostedUntil` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedPosts_id` PRIMARY KEY(`id`)
);
