CREATE TABLE `availabilityBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`inventoryUnitId` int,
	`dateStart` timestamp NOT NULL,
	`dateEnd` timestamp NOT NULL,
	`reason` varchar(500),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availabilityBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryUnits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`type` enum('room_type','vacation_unit','table_category','menu_highlight') NOT NULL,
	`name` varchar(180) NOT NULL,
	`capacity` int NOT NULL DEFAULT 1,
	`quantityAvailable` int NOT NULL DEFAULT 1,
	`baseRateRange` varchar(120),
	`photos` text,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryUnits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`type` enum('new_reservation','cancellation','review_flag','admin_message') NOT NULL,
	`reservationId` int,
	`message` varchar(500) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`destinationId` int,
	`inventoryUnitId` int,
	`guestName` varchar(180) NOT NULL,
	`guestContact` varchar(320) NOT NULL,
	`partySize` int NOT NULL DEFAULT 1,
	`roomOrTableRef` varchar(180),
	`dateStart` timestamp NOT NULL,
	`dateEnd` timestamp,
	`timeSlot` varchar(80),
	`status` enum('requested','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'requested',
	`source` enum('kabiyahe_direct','itinerary_linked') NOT NULL DEFAULT 'kabiyahe_direct',
	`notes` text,
	`cancelledReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partners` ADD `listingSubtype` enum('hotel_resort','airbnb_host','restaurant');--> statement-breakpoint
ALTER TABLE `partners` ADD `acceptReservations` int DEFAULT 0 NOT NULL;