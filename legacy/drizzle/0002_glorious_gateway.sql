CREATE TABLE `generatedTripStops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`stopOrder` int NOT NULL,
	`destinationId` int NOT NULL,
	`timeLabel` varchar(40) NOT NULL,
	`rationale` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedTripStops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedTrips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`travelers` int NOT NULL,
	`budgetLevel` int NOT NULL,
	`interests` text NOT NULL,
	`notes` text,
	`status` enum('draft','generating','ready','failed') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generatedTrips_id` PRIMARY KEY(`id`)
);
