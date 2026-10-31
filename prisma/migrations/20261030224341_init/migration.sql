-- CreateTable
CREATE TABLE `MailAccount` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `provider` ENUM('IMAP', 'GMAIL') NOT NULL DEFAULT 'IMAP',
    `imapHost` VARCHAR(191) NULL,
    `imapPort` INTEGER NULL DEFAULT 993,
    `imapSecure` BOOLEAN NOT NULL DEFAULT true,
    `imapUser` VARCHAR(191) NULL,
    `imapPasswordEnc` TEXT NULL,
    `oauthRefreshTokenEnc` TEXT NULL,
    `oauthAccessTokenEnc` TEXT NULL,
    `oauthTokenExpiresAt` DATETIME(3) NULL,
    `syncStatus` ENUM('IDLE', 'SYNCING', 'ERROR') NOT NULL DEFAULT 'IDLE',
    `syncError` TEXT NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MailAccount_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `MailAccount_usuarioId_email_key`(`usuarioId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Thread` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `rootMessageId` VARCHAR(191) NOT NULL,
    `subject` TEXT NOT NULL,
    `participants` JSON NOT NULL,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `lastMessageAt` DATETIME(3) NULL,
    `certificatePath` VARCHAR(191) NULL,
    `certificateGeneratedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Thread_accountId_lastMessageAt_idx`(`accountId`, `lastMessageAt`),
    UNIQUE INDEX `Thread_accountId_rootMessageId_key`(`accountId`, `rootMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `inReplyTo` VARCHAR(191) NULL,
    `references` JSON NULL,
    `folder` ENUM('INBOX', 'SENT') NOT NULL,
    `fromAddr` TEXT NOT NULL,
    `toAddrs` TEXT NOT NULL,
    `ccAddrs` TEXT NULL,
    `subject` TEXT NOT NULL,
    `bodyText` LONGTEXT NULL,
    `bodyHtml` LONGTEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `imapUid` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Message_threadId_date_idx`(`threadId`, `date`),
    INDEX `Message_accountId_folder_idx`(`accountId`, `folder`),
    UNIQUE INDEX `Message_accountId_messageId_key`(`accountId`, `messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `contentId` VARCHAR(191) NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attachment_messageId_idx`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Thread` ADD CONSTRAINT `Thread_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `MailAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `MailAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `Thread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
