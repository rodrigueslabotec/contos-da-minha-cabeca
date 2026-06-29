CREATE TABLE `author_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`bookId` int NOT NULL,
	`totalEarnings` decimal(12,2) NOT NULL DEFAULT '0',
	`subscriptionEarnings` decimal(12,2) NOT NULL DEFAULT '0',
	`purchaseEarnings` decimal(12,2) NOT NULL DEFAULT '0',
	`uniqueReaders` int NOT NULL DEFAULT 0,
	`monetizedReadCount` int NOT NULL DEFAULT 0,
	`lastCalculatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `author_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`chapterId` int NOT NULL,
	`pageNumber` int DEFAULT 1,
	`isMonetized` boolean NOT NULL DEFAULT false,
	`monetizationMethod` enum('subscription','purchase','free') DEFAULT 'free',
	`subscriptionId` int,
	`purchaseId` int,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('pix','mercadopago','stripe','paypal') NOT NULL,
	`status` enum('pending','processing','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`paymentData` text,
	`paidAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_payments_id` PRIMARY KEY(`id`)
);
