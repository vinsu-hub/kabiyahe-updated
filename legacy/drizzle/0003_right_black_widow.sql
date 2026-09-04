CREATE TABLE `walletTicketAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`tripId` varchar(180) NOT NULL,
	`entryName` varchar(180) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`url` varchar(800) NOT NULL,
	`mimeType` varchar(80) NOT NULL,
	`fileName` varchar(240) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletTicketAttachments_id` PRIMARY KEY(`id`)
);
