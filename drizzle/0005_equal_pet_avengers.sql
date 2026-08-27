CREATE TABLE `partnerStaff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','staff') NOT NULL DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerStaff_id` PRIMARY KEY(`id`)
);
