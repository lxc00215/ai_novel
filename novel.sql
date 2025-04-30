/*
Navicat MySQL Data Transfer

Source Server         : test
Source Server Version : 80012
Source Host           : localhost:3306
Source Database       : novel

Target Server Type    : MYSQL
Target Server Version : 80012
File Encoding         : 65001

Date: 2025-04-30 20:42:41
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for book_breakdowns
-- ----------------------------
DROP TABLE IF EXISTS `book_breakdowns`;
CREATE TABLE `book_breakdowns` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `file_id` varchar(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `analysis_content` text COLLATE utf8_unicode_ci NOT NULL,
  `analysis_type` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `idx_book_breakdowns_file_id` (`file_id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for characters
-- ----------------------------
DROP TABLE IF EXISTS `characters`;
CREATE TABLE `characters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `image_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `is_used` varchar(1) COLLATE utf8_unicode_ci DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `prompt` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `book_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=341 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `sender_type` enum('user','character') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`)
) ENGINE=MyISAM AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for chat_sessions
-- ----------------------------
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `character_id` int(11) NOT NULL,
  `last_message` mediumtext COLLATE utf8mb4_unicode_ci,
  `last_message_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_chat` (`user_id`,`character_id`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for crazy_walk_results
-- ----------------------------
DROP TABLE IF EXISTS `crazy_walk_results`;
CREATE TABLE `crazy_walk_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `novel_id` int(11) DEFAULT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `novel_type` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `chapter_count` int(11) DEFAULT NULL,
  `seeds` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `novel_id` (`novel_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for features
-- ----------------------------
DROP TABLE IF EXISTS `features`;
CREATE TABLE `features` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `model` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `prompt` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `base_url` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `api_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `temperature` float DEFAULT '0.7',
  `top_k` int(11) DEFAULT '50',
  `top_p` float DEFAULT '0.9',
  `max_tokens` int(11) DEFAULT '2048',
  `frequency_penalty` float DEFAULT '0',
  `presence_penalty` float DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_features_name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for feature_permissions
-- ----------------------------
DROP TABLE IF EXISTS `feature_permissions`;
CREATE TABLE `feature_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `feature_id` bigint(20) NOT NULL,
  `plan_type` enum('free','basic','pro') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `is_allowed` tinyint(1) DEFAULT '0',
  `usage_limit` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_feature_plan` (`feature_id`,`plan_type`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=FIXED;

-- ----------------------------
-- Table structure for feature_types
-- ----------------------------
DROP TABLE IF EXISTS `feature_types`;
CREATE TABLE `feature_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_feature_code` (`code`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for feature_usage
-- ----------------------------
DROP TABLE IF EXISTS `feature_usage`;
CREATE TABLE `feature_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `feature_type` enum('chapter','book','outline','inspiration') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `novel_id` int(11) DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_feature_usage_user_id` (`user_id`) USING BTREE,
  KEY `idx_feature_usage_novel_id` (`novel_id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `file_id` varchar(36) COLLATE utf8_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`file_id`),
  KEY `idx_files_user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for generated_chapters
-- ----------------------------
DROP TABLE IF EXISTS `generated_chapters`;
CREATE TABLE `generated_chapters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `order` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `content` text COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `summary` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `book_type` enum('CRAZY_WALK','WRITING') COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`)
) ENGINE=MyISAM AUTO_INCREMENT=251 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for inspiration_results
-- ----------------------------
DROP TABLE IF EXISTS `inspiration_results`;
CREATE TABLE `inspiration_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `characters` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `content` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `story_direction` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `prompt` text COLLATE utf8_unicode_ci NOT NULL,
  `cover_image` text COLLATE utf8_unicode_ci,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=135 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for models
-- ----------------------------
DROP TABLE IF EXISTS `models`;
CREATE TABLE `models` (
  `id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `provider_id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `top_k` int(11) DEFAULT '10',
  `temperature` float DEFAULT '0.5',
  `max_tokens` int(11) DEFAULT '8000',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `input_token_limit` int(16) DEFAULT NULL,
  `output_token_limit` int(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_id` (`provider_id`)
) ENGINE=MyISAM AUTO_INCREMENT=421 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for novels
-- ----------------------------
DROP TABLE IF EXISTS `novels`;
CREATE TABLE `novels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `chapters` varchar(11) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_top` int(255) NOT NULL DEFAULT '0',
  `is_archive` int(255) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=99 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `subscription_type` enum('basic','professional') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `subscription_period` enum('monthly','yearly') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_status` enum('pending','completed','failed','refunded') CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT 'pending',
  `transaction_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_payments_user_id` (`user_id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for prompts
-- ----------------------------
DROP TABLE IF EXISTS `prompts`;
CREATE TABLE `prompts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `title` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `content` text COLLATE utf8_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for providers
-- ----------------------------
DROP TABLE IF EXISTS `providers`;
CREATE TABLE `providers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `com_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `avatar_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `base_url` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `bio` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `text_logo_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET ascii COLLATE ascii_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for subscriptions
-- ----------------------------
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `plan_type` enum('basic','pro') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `billing_cycle` enum('monthly','yearly') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `auto_renew` tinyint(1) DEFAULT '1',
  `status` enum('active','expired','canceled') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_subscriptions_user_id` (`user_id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=FIXED;

-- ----------------------------
-- Table structure for subscription_plans
-- ----------------------------
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `display_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL,
  `price_yearly` decimal(10,2) NOT NULL,
  `chapters_quota` int(11) NOT NULL,
  `books_quota` int(11) NOT NULL,
  `outlines_quota` int(11) NOT NULL,
  `inspiration_quota` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `name` (`name`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Table structure for tasks
-- ----------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `task_type` enum('CRAZY_WALK','INSPIRATION','CRAZY_WALK_2','BOOK_BREAKDOWN') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `completion_percentage` int(11) DEFAULT '0',
  `prompt` text COLLATE utf8_unicode_ci NOT NULL,
  `status` enum('pending','processing','completed','failed') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'pending',
  `result_id` int(11) DEFAULT NULL,
  `result_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=311 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ----------------------------
-- Table structure for usage_logs
-- ----------------------------
DROP TABLE IF EXISTS `usage_logs`;
CREATE TABLE `usage_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `feature_type` enum('detailed','book_outline','chapter_style','inspiration') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `usage_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content_count` int(11) DEFAULT NULL COMMENT '内容数量（章节数/本数等）',
  `word_count` int(11) DEFAULT NULL COMMENT '字数（如适用）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_usage_logs_user_id` (`user_id`) USING BTREE,
  KEY `idx_usage_logs_feature_type` (`feature_type`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=FIXED;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `account` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `bio` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `story_count` int(11) DEFAULT NULL,
  `total_words` int(11) DEFAULT NULL,
  `writing_days` int(11) DEFAULT NULL,
  `subscription_type` enum('free','basic','professional') CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT 'free',
  `subscription_start_date` timestamp NULL DEFAULT NULL,
  `subscription_end_date` timestamp NULL DEFAULT NULL,
  `remaining_chapters` int(11) DEFAULT '3',
  `remaining_books` int(11) DEFAULT '1',
  `remaining_outlines` int(11) DEFAULT '1',
  `remaining_inspirations` int(11) DEFAULT '5',
  `last_quota_reset_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `username` (`account`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `phone_number` (`phone`) USING BTREE,
  UNIQUE KEY `description` (`bio`) USING BTREE
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Procedure structure for check_expired_subscriptions
-- ----------------------------
DROP PROCEDURE IF EXISTS `check_expired_subscriptions`;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `check_expired_subscriptions`()
BEGIN
    -- 找出所有已过期但状态仍为active的订阅
    UPDATE `subscriptions` 
    SET `status` = 'expired'
    WHERE `end_date` < NOW() AND `status` = 'active';
    
    -- 更新用户计划为free，对应已过期的订阅
    UPDATE `users` u
    JOIN `subscriptions` s ON u.id = s.user_id
    SET u.plan = 'free',
        u.subscription_end_date = NULL
    WHERE s.status = 'expired' 
    AND s.updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY);
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for reset_daily_usage_counts
-- ----------------------------
DROP PROCEDURE IF EXISTS `reset_daily_usage_counts`;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `reset_daily_usage_counts`()
BEGIN
    UPDATE `users` 
    SET `daily_usage_count` = 0, 
        `last_usage_reset_date` = CURRENT_DATE()
    WHERE `last_usage_reset_date` IS NULL OR `last_usage_reset_date` < CURRENT_DATE();
END
;;
DELIMITER ;
