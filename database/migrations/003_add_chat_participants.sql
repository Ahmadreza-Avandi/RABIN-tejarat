-- Add participant fields to chat_conversations table
ALTER TABLE `chat_conversations` 
ADD COLUMN `participant_1_id` varchar(36) DEFAULT NULL AFTER `created_by`,
ADD COLUMN `participant_2_id` varchar(36) DEFAULT NULL AFTER `participant_1_id`;

-- Add foreign key constraints
ALTER TABLE `chat_conversations`
ADD CONSTRAINT `fk_participant_1` FOREIGN KEY (`participant_1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_participant_2` FOREIGN KEY (`participant_2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Add indexes for better performance
ALTER TABLE `chat_conversations`
ADD INDEX `idx_participant_1` (`participant_1_id`),
ADD INDEX `idx_participant_2` (`participant_2_id`),
ADD INDEX `idx_participants` (`participant_1_id`, `participant_2_id`);