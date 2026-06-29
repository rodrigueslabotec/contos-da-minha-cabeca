CREATE TABLE `author_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`bookId` int NOT NULL,
	`sourceType` enum('purchase','access') NOT NULL,
	`sourceId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `author_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `book_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('pix','mercadopago','stripe','paypal','manual') DEFAULT 'manual',
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `book_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `book_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_rejections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`adminId` int NOT NULL,
	`reason` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `book_rejections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255),
	`slug` varchar(300) NOT NULL,
	`authorId` int NOT NULL,
	`categoryId` int,
	`synopsis` text,
	`coverUrl` text,
	`contentUrl` text,
	`contentRating` enum('livre','14+','18+') NOT NULL DEFAULT 'livre',
	`status` enum('draft','pending','approved','rejected','unpublished') NOT NULL DEFAULT 'draft',
	`price` decimal(10,2),
	`tags` text,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`avgRating` decimal(3,2) DEFAULT '0',
	`ratingCount` int NOT NULL DEFAULT 0,
	`accessLevel` enum('free','basic','premium') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`),
	CONSTRAINT `books_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`title` varchar(255),
	`orderIndex` int NOT NULL DEFAULT 0,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('subscription','book_purchase') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`method` enum('pix','mercadopago','stripe','paypal') NOT NULL,
	`status` enum('pending','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`referenceId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`chapterId` int,
	`progress` int DEFAULT 0,
	`lastReadAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`features` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','cancelled','expired','pending') NOT NULL DEFAULT 'pending',
	`startDate` timestamp,
	`endDate` timestamp,
	`paymentMethod` enum('pix','mercadopago','stripe','paypal','manual') DEFAULT 'manual',
	`paymentReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;