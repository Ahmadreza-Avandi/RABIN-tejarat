-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 08, 2025 at 02:31 PM
-- Server version: 11.8.2-MariaDB
-- PHP Version: 8.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'call',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `performed_by` varchar(36) NOT NULL,
  `outcome` varchar(50) DEFAULT 'completed',
  `location` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` varchar(36) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `type` enum('info','warning','error','success') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `user_id` varchar(36) DEFAULT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_dismissed` tinyint(1) DEFAULT 0,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `all_day` tinyint(1) DEFAULT 0,
  `type` enum('call','meeting','follow_up','task','reminder','personal') DEFAULT 'meeting',
  `customer_id` varchar(36) DEFAULT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `meeting_link` varchar(500) DEFAULT NULL,
  `assigned_to` varchar(36) NOT NULL,
  `status` enum('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  `reminder_minutes` int(11) DEFAULT 15,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` enum('direct','group','support') DEFAULT 'direct',
  `description` text DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_message_id` varchar(36) DEFAULT NULL,
  `last_message` text DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_groups`
--

CREATE TABLE `chat_groups` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_group_members`
--

CREATE TABLE `chat_group_members` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `group_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `conversation_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `receiver_id` varchar(36) NOT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','image','file','system') DEFAULT 'text',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `edited_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT current_timestamp(),
  `reply_to_id` varchar(36) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_participants`
--

CREATE TABLE `chat_participants` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT current_timestamp(),
  `last_seen_at` timestamp NULL DEFAULT current_timestamp(),
  `last_seen_message_id` varchar(36) DEFAULT NULL,
  `is_muted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_reactions`
--

CREATE TABLE `chat_reactions` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `emoji` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `size` enum('startup','small','medium','large','enterprise') DEFAULT 'small',
  `website` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'ایران',
  `postal_code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive','prospect','customer','partner') DEFAULT 'prospect',
  `rating` decimal(2,1) DEFAULT 0.0,
  `annual_revenue` decimal(15,2) DEFAULT NULL,
  `employee_count` int(11) DEFAULT NULL,
  `founded_year` year(4) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `assigned_to` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `full_name` varchar(255) GENERATED ALWAYS AS (concat(`first_name`,' ',`last_name`)) STORED,
  `job_title` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `twitter_url` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'ایران',
  `postal_code` varchar(20) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `avatar_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive','do_not_contact') DEFAULT 'active',
  `is_primary` tinyint(1) DEFAULT 0,
  `source` varchar(50) DEFAULT NULL,
  `last_contact_date` date DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_activities`
--

CREATE TABLE `contact_activities` (
  `id` varchar(36) NOT NULL,
  `contact_id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `activity_type` enum('call','email','meeting','note','task','deal','support') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('completed','pending','cancelled') DEFAULT 'completed',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `due_date` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `outcome` enum('successful','no_answer','follow_up_needed','not_interested','other') DEFAULT NULL,
  `next_action` text DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Iran',
  `postal_code` varchar(20) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `company_size` enum('1-10','11-50','51-200','201-1000','1000+') DEFAULT NULL,
  `annual_revenue` decimal(15,2) DEFAULT NULL,
  `status` enum('active','inactive','follow_up','rejected','prospect','customer') DEFAULT 'prospect',
  `segment` enum('enterprise','small_business','individual') DEFAULT 'small_business',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `assigned_to` varchar(36) DEFAULT NULL,
  `total_tickets` int(11) DEFAULT 0,
  `satisfaction_score` decimal(3,2) DEFAULT NULL,
  `potential_value` decimal(15,2) DEFAULT NULL,
  `actual_value` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_interaction` timestamp NULL DEFAULT NULL,
  `last_contact_date` timestamp NULL DEFAULT NULL,
  `contact_attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_health`
--

CREATE TABLE `customer_health` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `overall_score` int(11) DEFAULT 50,
  `usage_score` int(11) DEFAULT 50,
  `satisfaction_score` int(11) DEFAULT 50,
  `financial_score` int(11) DEFAULT 50,
  `support_score` int(11) DEFAULT 50,
  `risk_level` enum('low','medium','high') DEFAULT 'medium',
  `risk_factors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`risk_factors`)),
  `calculated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_journey`
--

CREATE TABLE `customer_journey` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `stage_id` varchar(36) NOT NULL,
  `entered_at` timestamp NULL DEFAULT current_timestamp(),
  `exited_at` timestamp NULL DEFAULT NULL,
  `interaction_id` varchar(36) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_journey_stages`
--

CREATE TABLE `customer_journey_stages` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `stage_order` int(11) NOT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_tags`
--

CREATE TABLE `customer_tags` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `tag` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `daily_interaction_stats`
-- (See below for the actual view)
--
CREATE TABLE `daily_interaction_stats` (
`interaction_date` date
,`type` enum('email','phone','chat','meeting','website','social')
,`direction` enum('inbound','outbound')
,`sentiment` enum('positive','neutral','negative')
,`interaction_count` bigint(21)
,`avg_duration` decimal(14,4)
);

-- --------------------------------------------------------

--
-- Table structure for table `daily_reports`
--

CREATE TABLE `daily_reports` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) NOT NULL,
  `report_date` date NOT NULL,
  `persian_date` varchar(20) NOT NULL,
  `work_description` text NOT NULL,
  `completed_tasks` text DEFAULT NULL,
  `working_hours` decimal(4,2) DEFAULT NULL,
  `challenges` text DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `status` enum('draft','submitted') DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='گزارش‌های روزانه کاربران';

-- --------------------------------------------------------

--
-- Table structure for table `deals`
--

CREATE TABLE `deals` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `total_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) DEFAULT 'IRR',
  `stage_id` varchar(36) NOT NULL,
  `probability` int(11) DEFAULT 50,
  `expected_close_date` date DEFAULT NULL,
  `actual_close_date` date DEFAULT NULL,
  `assigned_to` varchar(36) NOT NULL,
  `loss_reason` text DEFAULT NULL,
  `won_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `current_stage_entered_at` timestamp NULL DEFAULT current_timestamp(),
  `next_follow_up_date` timestamp NULL DEFAULT NULL,
  `sales_notes` text DEFAULT NULL,
  `customer_budget` decimal(15,2) DEFAULT NULL,
  `decision_maker` varchar(255) DEFAULT NULL,
  `competition_info` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deal_products`
--

CREATE TABLE `deal_products` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `deal_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `total_price` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deal_stage_history`
--

CREATE TABLE `deal_stage_history` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `deal_id` varchar(36) NOT NULL,
  `stage_id` varchar(36) NOT NULL,
  `entered_at` timestamp NULL DEFAULT current_timestamp(),
  `exited_at` timestamp NULL DEFAULT NULL,
  `changed_by` varchar(36) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_attendees`
--

CREATE TABLE `event_attendees` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `event_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `contact_id` varchar(36) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `response` enum('pending','accepted','declined','maybe') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `type` enum('csat','nps','ces','complaint','suggestion','praise') NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `score` decimal(3,2) DEFAULT NULL,
  `product` varchar(255) DEFAULT NULL,
  `channel` enum('email','website','phone','chat','sms','survey') DEFAULT 'website',
  `category` varchar(100) DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','dismissed') DEFAULT 'pending',
  `sentiment` enum('positive','neutral','negative') DEFAULT NULL,
  `sentiment_score` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interactions`
--

CREATE TABLE `interactions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `type` enum('email','phone','chat','meeting','website','social') NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `channel` varchar(100) DEFAULT NULL,
  `date` timestamp NULL DEFAULT current_timestamp(),
  `duration` int(11) DEFAULT NULL,
  `outcome` text DEFAULT NULL,
  `sentiment` enum('positive','neutral','negative') DEFAULT NULL,
  `performed_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interaction_attachments`
--

CREATE TABLE `interaction_attachments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `interaction_id` varchar(36) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interaction_follow_ups`
--

CREATE TABLE `interaction_follow_ups` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `interaction_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `assigned_to` varchar(36) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `interaction_summary`
-- (See below for the actual view)
--
CREATE TABLE `interaction_summary` (
`id` varchar(36)
,`customer_id` varchar(36)
,`type` enum('email','phone','chat','meeting','website','social')
,`subject` varchar(255)
,`description` text
,`direction` enum('inbound','outbound')
,`channel` varchar(100)
,`date` timestamp
,`duration` int(11)
,`outcome` text
,`sentiment` enum('positive','neutral','negative')
,`performed_by` varchar(36)
,`customer_name` varchar(255)
,`customer_email` varchar(255)
,`customer_segment` enum('enterprise','small_business','individual')
,`performed_by_name` varchar(255)
,`attachment_count` bigint(21)
,`tag_count` bigint(21)
,`follow_up_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `interaction_tags`
--

CREATE TABLE `interaction_tags` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `interaction_id` varchar(36) NOT NULL,
  `tag` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `route` varchar(200) DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'LayoutDashboard',
  `sort_order` int(11) DEFAULT 0,
  `parent_id` varchar(36) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `name`, `display_name`, `description`, `route`, `icon`, `sort_order`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
('2f9bd793-6678-11f0-9334-e4580a2bbc2b', 'dashboard', 'داشبورد', 'صفحه اصلی سیستم', '/dashboard', 'LayoutDashboard', 1, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdb02-6678-11f0-9334-e4580a2bbc2b', 'customers', 'مشتریان', 'مدیریت مشتریان', '/dashboard/customers', 'Users', 2, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdbbe-6678-11f0-9334-e4580a2bbc2b', 'contacts', 'مخاطبین', 'مدیریت مخاطبین', '/dashboard/contacts', 'UserCheck', 3, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdc15-6678-11f0-9334-e4580a2bbc2b', 'coworkers', 'همکاران', 'مدیریت همکاران', '/dashboard/coworkers', 'Users2', 4, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdc68-6678-11f0-9334-e4580a2bbc2b', 'activities', 'فعالیت‌ها', 'مدیریت فعالیت‌ها', '/dashboard/activities', 'Activity', 5, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdcff-6678-11f0-9334-e4580a2bbc2b', 'interactions', 'تعاملات', 'مدیریت تعاملات مشتریان', '/dashboard/interactions', 'MessageCircle', 6, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdd4b-6678-11f0-9334-e4580a2bbc2b', 'tasks', 'وظایف', 'مدیریت وظایف', '/dashboard/tasks', 'CheckSquare', 7, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bde49-6678-11f0-9334-e4580a2bbc2b', 'sales', 'ثبت فروش', 'ثبت و مدیریت فروش', '/dashboard/sales', 'TrendingUp', 8, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bde98-6678-11f0-9334-e4580a2bbc2b', 'products', 'محصولات', 'مدیریت محصولات', '/dashboard/products', 'Package', 9, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdf07-6678-11f0-9334-e4580a2bbc2b', 'feedback', 'بازخوردها', 'مدیریت بازخوردها', '/dashboard/feedback', 'MessageCircle', 10, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdf55-6678-11f0-9334-e4580a2bbc2b', 'surveys', 'نظرسنجی‌ها', 'مدیریت نظرسنجی‌ها', '/dashboard/surveys', 'ClipboardList', 11, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdfa0-6678-11f0-9334-e4580a2bbc2b', 'csat', 'CSAT', 'امتیازدهی رضایت مشتری', '/dashboard/csat', 'Star', 12, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9bdfea-6678-11f0-9334-e4580a2bbc2b', 'nps', 'NPS', 'شاخص وفاداری مشتری', '/dashboard/nps', 'TrendingUp', 13, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be035-6678-11f0-9334-e4580a2bbc2b', 'emotions', 'تحلیل احساسات', 'تحلیل احساسات مشتریان', '/dashboard/emotions', 'Heart', 14, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be06b-6678-11f0-9334-e4580a2bbc2b', 'insights', 'بینش‌های خودکار', 'تحلیل خودکار داده‌ها', '/dashboard/insights', 'BarChart3', 49, NULL, 1, '2025-07-21 21:25:01', '2025-07-27 07:17:24'),
('2f9be0c5-6678-11f0-9334-e4580a2bbc2b', 'touchpoints', 'نقاط تماس', 'نقاط تماس با مشتری', '/dashboard/touchpoints', 'Target', 16, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be0f6-6678-11f0-9334-e4580a2bbc2b', 'customer-health', 'سلامت مشتری', 'سلامت و وضعیت مشتری', '/dashboard/customer-health', 'Activity', 17, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be126-6678-11f0-9334-e4580a2bbc2b', 'alerts', 'هشدارها', 'هشدارهای سیستم', '/dashboard/alerts', 'Bell', 18, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be153-6678-11f0-9334-e4580a2bbc2b', 'voice-of-customer', 'صدای مشتری (VOC)', 'تحلیل صدای مشتری', '/dashboard/voice-of-customer', 'Mic', 19, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be184-6678-11f0-9334-e4580a2bbc2b', 'projects', 'پروژه‌ها', 'مدیریت پروژه‌ها', '/dashboard/projects', 'Briefcase', 20, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be1b4-6678-11f0-9334-e4580a2bbc2b', 'calendar', 'تقویم', 'تقویم و برنامه‌ریزی', '/dashboard/calendar', 'Calendar', 21, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be1e2-6678-11f0-9334-e4580a2bbc2b', 'reports', 'گزارش‌ها', 'گزارش‌های سیستم', '/dashboard/reports', 'FileText', 22, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be20f-6678-11f0-9334-e4580a2bbc2b', 'profile', 'پروفایل', 'پروفایل کاربری', '/dashboard/profile', 'User', 23, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be23b-6678-11f0-9334-e4580a2bbc2b', 'settings', 'تنظیمات عمومی', 'تنظیمات سیستم', '/dashboard/settings', 'Settings', 24, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('2f9be26b-6678-11f0-9334-e4580a2bbc2b', 'cem-settings', 'تنظیمات CEM', 'تنظیمات CEM', '/dashboard/cem-settings', 'Settings2', 25, NULL, 1, '2025-07-21 21:25:01', '2025-07-21 21:25:01'),
('3f68a634-75d5-4107-a6a8-a7fb664ab55c', 'daily_reports', 'گزارش‌های روزانه', NULL, '/dashboard/daily-reports', 'FileText', 15, NULL, 1, '2025-07-25 21:44:33', '2025-07-25 21:44:33'),
('be98ee61-6ab9-11f0-9078-dc3575acfdef', 'reports_analysis', 'تحلیل گزارشات', 'تحلیل گزارشات روزانه با هوش مصنوعی', '/dashboard/insights/reports-analysis', 'Brain', 50, NULL, 1, '2025-07-27 07:17:24', '2025-07-27 07:17:24');

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) DEFAULT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` enum('customer_need','sales_tip','objection','general','technical','pricing') DEFAULT 'general',
  `is_private` tinyint(1) DEFAULT 0,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `note_tags`
--

CREATE TABLE `note_tags` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `note_id` varchar(36) NOT NULL,
  `tag` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` varchar(36) DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `display_name`, `description`, `created_at`) VALUES
('50d56977-653a-11f0-92b6-e251efb8cddb', 'read', 'مشاهده', NULL, '2025-07-20 07:22:38'),
('50d56c82-653a-11f0-92b6-e251efb8cddb', 'create', 'ایجاد', NULL, '2025-07-20 07:22:38'),
('50d56ce8-653a-11f0-92b6-e251efb8cddb', 'update', 'ویرایش', NULL, '2025-07-20 07:22:38'),
('50d56e9a-653a-11f0-92b6-e251efb8cddb', 'delete', 'حذف', NULL, '2025-07-20 07:22:38'),
('50d56ef8-653a-11f0-92b6-e251efb8cddb', 'manage', 'مدیریت', NULL, '2025-07-20 07:22:38'),
('a6be014e-70f7-11f0-9275-e24ee17dce91', 'view_all', 'مشاهده همه', 'دسترسی به مشاهده تمام بخش‌ها', '2025-08-04 05:55:41'),
('a6be02db-70f7-11f0-9275-e24ee17dce91', 'create_all', 'ایجاد همه', 'دسترسی به ایجاد در تمام بخش‌ها', '2025-08-04 05:55:41'),
('a6be0325-70f7-11f0-9275-e24ee17dce91', 'edit_all', 'ویرایش همه', 'دسترسی به ویرایش در تمام بخش‌ها', '2025-08-04 05:55:41'),
('a6be0346-70f7-11f0-9275-e24ee17dce91', 'delete_all', 'حذف همه', 'دسترسی به حذف در تمام بخش‌ها', '2025-08-04 05:55:41'),
('a6be0382-70f7-11f0-9275-e24ee17dce91', 'admin_access', 'دسترسی مدیر', 'دسترسی کامل مدیریتی', '2025-08-04 05:55:41');

-- --------------------------------------------------------

--
-- Table structure for table `pipeline_stages`
--

CREATE TABLE `pipeline_stages` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `stage_order` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `color` varchar(7) DEFAULT '#3B82F6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pipeline_stages`
--

INSERT INTO `pipeline_stages` (`id`, `name`, `code`, `description`, `stage_order`, `is_active`, `color`) VALUES
('252c6e8d-69f8-11f0-92a7-e251ebaa91d8', 'New Lead', 'new_lead', 'تماس اولیه', 1, 1, '#10B981'),
('252c71b5-69f8-11f0-92a7-e251ebaa91d8', 'Needs Assessment', 'needs_assessment', 'تشخیص نیاز', 2, 1, '#3B82F6'),
('252c7309-69f8-11f0-92a7-e251ebaa91d8', 'Product Presentation', 'product_presentation', 'معرفی محصول', 3, 1, '#8B5CF6'),
('252c7408-69f8-11f0-92a7-e251ebaa91d8', 'Proposal Sent', 'proposal_sent', 'ارسال پیشنهاد', 4, 1, '#F59E0B'),
('252c7507-69f8-11f0-92a7-e251ebaa91d8', 'Negotiation', 'negotiation', 'مذاکره', 5, 1, '#EF4444'),
('252c75dd-69f8-11f0-92a7-e251ebaa91d8', 'Closed Won', 'closed_won', 'فروش موفق', 6, 1, '#059669'),
('252c76ae-69f8-11f0-92a7-e251ebaa91d8', 'Closed Lost', 'closed_lost', 'فروش رد شده', 7, 1, '#DC2626'),
('252c7783-69f8-11f0-92a7-e251ebaa91d8', 'Delivery', 'delivery', 'تحویل محصول', 8, 1, '#7C3AED'),
('252c78c2-69f8-11f0-92a7-e251ebaa91d8', 'After Sales', 'after_sales', 'پشتیبانی', 9, 1, '#0891B2');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `specifications` text DEFAULT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'IRR',
  `is_active` tinyint(1) DEFAULT 1,
  `inventory` int(11) DEFAULT 999,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_discounts`
--

CREATE TABLE `product_discounts` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `product_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_quantity` int(11) DEFAULT 1,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planning','in_progress','review','completed','on_hold','cancelled') DEFAULT 'planning',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `budget` decimal(15,2) DEFAULT NULL,
  `spent` decimal(15,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `progress` decimal(5,2) DEFAULT 0.00,
  `manager_id` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `color` varchar(7) DEFAULT '#3B82F6',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

CREATE TABLE `project_members` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `project_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('manager','member','viewer') DEFAULT 'member',
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `assigned_by` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_milestones`
--

CREATE TABLE `project_milestones` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `project_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `order_index` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_tags`
--

CREATE TABLE `project_tags` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `project_id` varchar(36) NOT NULL,
  `tag` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_team`
--

CREATE TABLE `project_team` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `project_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` varchar(100) DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `deal_id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'IRR',
  `payment_status` enum('pending','partial','paid','refunded') DEFAULT 'pending',
  `payment_method` varchar(100) DEFAULT NULL,
  `sale_date` timestamp NULL DEFAULT current_timestamp(),
  `delivery_date` timestamp NULL DEFAULT NULL,
  `payment_due_date` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `sales_person_id` varchar(36) NOT NULL,
  `sales_person_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sales_pipeline_report`
-- (See below for the actual view)
--
CREATE TABLE `sales_pipeline_report` (
`deal_id` varchar(36)
,`deal_title` varchar(255)
,`customer_name` varchar(255)
,`customer_segment` enum('enterprise','small_business','individual')
,`sales_person` varchar(255)
,`current_stage` varchar(100)
,`stage_order` int(11)
,`total_value` decimal(15,2)
,`probability` int(11)
,`expected_close_date` date
,`current_stage_entered_at` timestamp
,`next_follow_up_date` timestamp
,`days_in_current_stage` int(8)
,`status` varchar(8)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `sales_statistics`
-- (See below for the actual view)
--
CREATE TABLE `sales_statistics` (
`sale_date` date
,`total_sales` bigint(21)
,`total_revenue` decimal(37,2)
,`average_sale_value` decimal(19,6)
,`sales_person` varchar(255)
,`sales_person_id` varchar(36)
);

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `sale_id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(15,2) NOT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `total_price` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surveys`
--

CREATE TABLE `surveys` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('csat','nps','custom','product','employee') DEFAULT 'csat',
  `status` enum('draft','active','paused','completed') DEFAULT 'draft',
  `target_responses` int(11) DEFAULT 100,
  `actual_responses` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_questions`
--

CREATE TABLE `survey_questions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `survey_id` varchar(36) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('rating','text','multiple_choice','yes_no') NOT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `order_index` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_responses`
--

CREATE TABLE `survey_responses` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `survey_id` varchar(36) NOT NULL,
  `question_id` varchar(36) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `response_text` text DEFAULT NULL,
  `response_value` decimal(3,2) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `updated_at`, `updated_by`) VALUES
('0b753b1b-6526-11f0-92b6-e251efb8cddb', 'company_name', 'شرکت رابین', 'string', 'رابین تجارت\r\n', 1, '2025-07-26 05:55:26', NULL),
('0b753ca1-6526-11f0-92b6-e251efb8cddb', 'currency', 'IRR', 'string', 'واحد پول پیش‌فرض', 1, '2025-07-20 04:57:32', NULL),
('0b753d16-6526-11f0-92b6-e251efb8cddb', 'timezone', 'Asia/Tehran', 'string', 'منطقه زمانی', 1, '2025-07-20 04:57:32', NULL),
('0b753d56-6526-11f0-92b6-e251efb8cddb', 'language', 'fa', 'string', 'زبان پیش‌فرض', 1, '2025-07-20 04:57:32', NULL),
('0b753d97-6526-11f0-92b6-e251efb8cddb', 'max_file_size', '10485760', 'number', 'حداکثر اندازه فایل (بایت)', 0, '2025-07-20 04:57:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `deal_id` varchar(36) DEFAULT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `assigned_to` varchar(36) NOT NULL,
  `assigned_by` varchar(36) NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `category` enum('call','meeting','follow_up','proposal','admin','other') DEFAULT 'follow_up',
  `due_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_assignees`
--

CREATE TABLE `task_assignees` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `task_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `assigned_at` timestamp NULL DEFAULT current_timestamp(),
  `assigned_by` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `task_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_files`
--

CREATE TABLE `task_files` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `task_id` varchar(36) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_by` varchar(36) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_steps`
--

CREATE TABLE `task_steps` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `task_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `status` enum('pending','in_progress','completed','skipped') DEFAULT 'pending',
  `due_date` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by` varchar(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `customer_id` varchar(36) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('open','in_progress','waiting_customer','closed') DEFAULT 'open',
  `category` varchar(100) DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `resolution_time` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_updates`
--

CREATE TABLE `ticket_updates` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `ticket_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('comment','status_change','assignment_change','priority_change') DEFAULT 'comment',
  `content` text DEFAULT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('ceo','sales_manager','sales_agent','agent') DEFAULT 'sales_agent',
  `status` enum('active','inactive','away','online','offline') DEFAULT 'active',
  `avatar` varchar(500) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `team` varchar(100) DEFAULT NULL,
  `last_active` timestamp NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `password`, `role`, `status`, `avatar`, `avatar_url`, `phone`, `team`, `last_active`, `last_login`, `created_at`, `updated_at`, `created_by`) VALUES
('ceo-001', 'مهندس کریمی', 'Robintejarat@gmail.com', '$2b$10$ZD73doDN4r.HxJ5LPjGnXOOgRcYTBi3aLQjyR/WbL.J0F41lY1YcK', 'admin123', 'ceo', 'active', NULL, NULL, '', NULL, '2025-07-20 04:57:32', '2025-08-08 10:08:36', '2025-07-20 04:57:32', '2025-08-08 10:08:36', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `user_interaction_performance`
-- (See below for the actual view)
--
CREATE TABLE `user_interaction_performance` (
`user_id` varchar(36)
,`user_name` varchar(255)
,`role` enum('ceo','sales_manager','sales_agent','agent')
,`total_interactions` bigint(21)
,`positive_interactions` bigint(21)
,`negative_interactions` bigint(21)
,`avg_interaction_duration` decimal(14,4)
,`phone_interactions` bigint(21)
,`email_interactions` bigint(21)
,`chat_interactions` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `user_module_permissions`
--

CREATE TABLE `user_module_permissions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) NOT NULL,
  `module_id` varchar(36) NOT NULL,
  `granted` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_module_permissions`
--

INSERT INTO `user_module_permissions` (`id`, `user_id`, `module_id`, `granted`, `created_at`, `updated_at`) VALUES
('0c313dc2-69e3-11f0-92a7-e251ebaa91d8', 'b007b8be-1f2e-4364-88c2-856b76e77984', '3f68a634-75d5-4107-a6a8-a7fb664ab55c', 1, '2025-07-26 05:40:33', '2025-07-26 05:40:33'),
('0c313e9a-69e3-11f0-92a7-e251ebaa91d8', 'ceo-001', '3f68a634-75d5-4107-a6a8-a7fb664ab55c', 1, '2025-07-26 05:40:33', '2025-07-26 05:40:33'),
('0c313f56-69e3-11f0-92a7-e251ebaa91d8', 'fff87449-a074-4a50-a35e-ba15b70fd414', '3f68a634-75d5-4107-a6a8-a7fb664ab55c', 1, '2025-07-26 05:40:33', '2025-07-26 05:40:33'),
('7aa1d0d3-68b9-11f0-92b6-e251eeb8cbd2', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9bdc15-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-24 18:10:29', '2025-07-24 18:10:29'),
('7aa1e2c1-68b9-11f0-92b6-e251eeb8cbd2', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9bdc68-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-24 18:10:29', '2025-07-24 18:10:29'),
('a2d3e5ed-70f1-11f0-9275-e24ee17dce91', 'c032caab-5d9b-4a9d-920f-ea9c7703a1fb', '2f9bd793-6678-11f0-9334-e4580a2bbc2b', 1, '2025-08-04 05:12:37', '2025-08-04 05:12:37'),
('a2d676c0-70f1-11f0-9275-e24ee17dce91', 'c032caab-5d9b-4a9d-920f-ea9c7703a1fb', '2f9bdb02-6678-11f0-9334-e4580a2bbc2b', 1, '2025-08-04 05:12:37', '2025-08-04 05:12:37'),
('aa01365c-70f1-11f0-9275-e24ee17dce91', 'c032caab-5d9b-4a9d-920f-ea9c7703a1fb', '2f9be184-6678-11f0-9334-e4580a2bbc2b', 1, '2025-08-04 05:12:49', '2025-08-04 05:12:49'),
('aa05d049-70f1-11f0-9275-e24ee17dce91', 'c032caab-5d9b-4a9d-920f-ea9c7703a1fb', '2f9be1e2-6678-11f0-9334-e4580a2bbc2b', 1, '2025-08-04 05:12:49', '2025-08-04 05:12:49'),
('aa05f02f-70f1-11f0-9275-e24ee17dce91', 'c032caab-5d9b-4a9d-920f-ea9c7703a1fb', '2f9be1b4-6678-11f0-9334-e4580a2bbc2b', 1, '2025-08-04 05:12:49', '2025-08-04 05:12:49'),
('acd8bb9b-67f2-11f0-92f0-e354fbedb1ae', 'b007b8be-1f2e-4364-88c2-856b76e77984', '2f9bd793-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-23 18:27:22', '2025-07-23 18:27:22'),
('c4ab9216-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bd793-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('c4afa278-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bdbbe-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('c4afb6bf-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bdb02-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('c4b02dcf-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bdc15-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('c4b02f1f-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bdcff-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('c4b219fc-6c45-11f0-9309-e35501041456', 'cf95fa0d-c06d-45e6-ae06-f5e02126f436', '2f9bdc68-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-29 06:32:15', '2025-07-29 06:32:15'),
('e6f12f06-67f2-11f0-92f0-e354fbedb1ae', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9bd793-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-23 18:29:00', '2025-07-24 18:10:29'),
('e6f17384-67f2-11f0-92f0-e354fbedb1ae', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9bdb02-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-23 18:29:00', '2025-07-24 18:10:29'),
('e6f1a24b-67f2-11f0-92f0-e354fbedb1ae', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9bdbbe-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-23 18:29:00', '2025-07-24 18:10:29'),
('e6f1e17e-67f2-11f0-92f0-e354fbedb1ae', 'fff87449-a074-4a50-a35e-ba15b70fd414', '2f9be20f-6678-11f0-9334-e4580a2bbc2b', 1, '2025-07-23 18:29:00', '2025-07-23 18:29:00');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `granted` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`id`, `user_id`, `resource`, `action`, `granted`, `created_at`) VALUES
('0b74f520-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'users', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f67b-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'customers', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f6f2-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'deals', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f72d-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'products', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f761-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'tickets', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f792-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'feedback', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f7c6-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'projects', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f7f4-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'reports', 'manage', 1, '2025-07-20 04:57:32'),
('0b74f824-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'settings', 'manage', 1, '2025-07-20 04:57:32'),
('0b74fa00-6526-11f0-92b6-e251efb8cddb', 'ceo-001', 'analytics', 'manage', 1, '2025-07-20 04:57:32');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_targets`
--

CREATE TABLE `user_targets` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(36) NOT NULL,
  `period` enum('monthly','quarterly','yearly') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `sales_count_target` int(11) DEFAULT 0,
  `sales_amount_target` decimal(15,2) DEFAULT 0.00,
  `call_count_target` int(11) DEFAULT 0,
  `deal_count_target` int(11) DEFAULT 0,
  `meeting_count_target` int(11) DEFAULT 0,
  `current_sales_count` int(11) DEFAULT 0,
  `current_sales_amount` decimal(15,2) DEFAULT 0.00,
  `current_call_count` int(11) DEFAULT 0,
  `current_deal_count` int(11) DEFAULT 0,
  `current_meeting_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voc_insights`
--

CREATE TABLE `voc_insights` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `impact` enum('low','medium','high') NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `status` enum('new','in_progress','completed','dismissed') DEFAULT 'new',
  `source` varchar(100) DEFAULT NULL,
  `frequency` int(11) DEFAULT 1,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`keywords`)),
  `sentiment_trend` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sentiment_trend`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer` (`customer_id`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_start_time` (`start_time`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_resource_type` (`resource_type`),
  ADD KEY `idx_resource_id` (`resource_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `deal_id` (`deal_id`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `deal_id` (`deal_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversations_type` (`type`),
  ADD KEY `idx_conversations_last_message_at` (`last_message_at`),
  ADD KEY `idx_conversations_created_by` (`created_by`),
  ADD KEY `fk_last_message` (`last_message_id`);

--
-- Indexes for table `chat_groups`
--
ALTER TABLE `chat_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `chat_group_members`
--
ALTER TABLE `chat_group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_member` (`group_id`,`user_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_sender` (`sender_id`),
  ADD KEY `idx_chat_receiver` (`receiver_id`);

--
-- Indexes for table `chat_participants`
--
ALTER TABLE `chat_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation_user` (`conversation_id`,`user_id`),
  ADD KEY `idx_participants_conversation_id` (`conversation_id`),
  ADD KEY `idx_participants_user_id` (`user_id`);

--
-- Indexes for table `chat_reactions`
--
ALTER TABLE `chat_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_user_emoji` (`message_id`,`user_id`,`emoji`),
  ADD KEY `idx_reactions_message_id` (`message_id`),
  ADD KEY `idx_reactions_user_id` (`user_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_companies_name` (`name`),
  ADD KEY `idx_companies_status` (`status`),
  ADD KEY `idx_companies_assigned_to` (`assigned_to`),
  ADD KEY `idx_companies_created_by` (`created_by`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contacts_company_id` (`company_id`),
  ADD KEY `idx_contacts_email` (`email`),
  ADD KEY `idx_contacts_full_name` (`full_name`),
  ADD KEY `idx_contacts_status` (`status`),
  ADD KEY `idx_contacts_assigned_to` (`assigned_to`),
  ADD KEY `idx_contacts_created_by` (`created_by`);
ALTER TABLE `contacts` ADD FULLTEXT KEY `full_name` (`full_name`,`email`,`notes`);

--
-- Indexes for table `contact_activities`
--
ALTER TABLE `contact_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activities_contact_id` (`contact_id`),
  ADD KEY `idx_activities_company_id` (`company_id`),
  ADD KEY `idx_activities_type` (`activity_type`),
  ADD KEY `idx_activities_status` (`status`),
  ADD KEY `idx_activities_due_date` (`due_date`),
  ADD KEY `idx_activities_assigned_to` (`assigned_to`),
  ADD KEY `idx_activities_created_by` (`created_by`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_segment` (`segment`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `customer_health`
--
ALTER TABLE `customer_health`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_customer_health` (`customer_id`);

--
-- Indexes for table `customer_journey`
--
ALTER TABLE `customer_journey`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_stage_id` (`stage_id`),
  ADD KEY `idx_interaction_id` (`interaction_id`),
  ADD KEY `idx_entered_at` (`entered_at`);

--
-- Indexes for table `customer_journey_stages`
--
ALTER TABLE `customer_journey_stages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_stage_order` (`stage_order`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `customer_tags`
--
ALTER TABLE `customer_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_customer_tag` (`customer_id`,`tag`);

--
-- Indexes for table `daily_reports`
--
ALTER TABLE `daily_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_date` (`user_id`,`report_date`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_report_date` (`report_date`),
  ADD KEY `idx_persian_date` (`persian_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `deals`
--
ALTER TABLE `deals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_stage_id` (`stage_id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_expected_close_date` (`expected_close_date`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `deal_products`
--
ALTER TABLE `deal_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `deal_id` (`deal_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `deal_stage_history`
--
ALTER TABLE `deal_stage_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `deal_id` (`deal_id`),
  ADD KEY `stage_id` (`stage_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `contact_id` (`contact_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_sentiment` (`sentiment`);

--
-- Indexes for table `interactions`
--
ALTER TABLE `interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_performed_by` (`performed_by`);

--
-- Indexes for table `interaction_attachments`
--
ALTER TABLE `interaction_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interaction_id` (`interaction_id`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `interaction_follow_ups`
--
ALTER TABLE `interaction_follow_ups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interaction_id` (`interaction_id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `interaction_tags`
--
ALTER TABLE `interaction_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_interaction_tag` (`interaction_id`,`tag`),
  ADD KEY `idx_tag` (`tag`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_parent_id` (`parent_id`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_deal_id` (`deal_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `note_tags`
--
ALTER TABLE `note_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_note_tag` (`note_id`,`tag`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_unread` (`user_id`,`is_read`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `pipeline_stages`
--
ALTER TABLE `pipeline_stages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `unique_stage_order` (`stage_order`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `product_discounts`
--
ALTER TABLE `product_discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_manager_id` (`manager_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `projects_manager_id` (`manager_id`),
  ADD KEY `projects_created_by` (`created_by`),
  ADD KEY `projects_customer_id` (`customer_id`);

--
-- Indexes for table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_member` (`project_id`,`user_id`),
  ADD KEY `project_members_project_id` (`project_id`),
  ADD KEY `project_members_user_id` (`user_id`),
  ADD KEY `project_members_assigned_by` (`assigned_by`);

--
-- Indexes for table `project_milestones`
--
ALTER TABLE `project_milestones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_tags`
--
ALTER TABLE `project_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_tag` (`project_id`,`tag`);

--
-- Indexes for table `project_team`
--
ALTER TABLE `project_team`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_user` (`project_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_deal_id` (`deal_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_sales_person_id` (`sales_person_id`),
  ADD KEY `idx_sale_date` (`sale_date`),
  ADD KEY `idx_payment_status` (`payment_status`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `surveys`
--
ALTER TABLE `surveys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_id` (`survey_id`);

--
-- Indexes for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_id` (`survey_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_deal_id` (`deal_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `tasks_project_id` (`project_id`);

--
-- Indexes for table `task_assignees`
--
ALTER TABLE `task_assignees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_task_user` (`task_id`,`user_id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `task_files`
--
ALTER TABLE `task_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_id` (`task_id`),
  ADD KEY `idx_uploaded_by` (`uploaded_by`);

--
-- Indexes for table `task_steps`
--
ALTER TABLE `task_steps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_steps_task_id` (`task_id`),
  ADD KEY `task_steps_completed_by` (`completed_by`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `ticket_updates`
--
ALTER TABLE `ticket_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_module_permissions`
--
ALTER TABLE `user_module_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_module` (`user_id`,`module_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_module_id` (`module_id`),
  ADD KEY `idx_granted` (`granted`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_permission` (`user_id`,`resource`,`action`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_targets`
--
ALTER TABLE `user_targets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_period` (`user_id`,`period`,`start_date`);

--
-- Indexes for table `voc_insights`
--
ALTER TABLE `voc_insights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_impact` (`impact`);

-- --------------------------------------------------------

--
-- Structure for view `daily_interaction_stats`
--
DROP TABLE IF EXISTS `daily_interaction_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `daily_interaction_stats`  AS SELECT cast(`interactions`.`date` as date) AS `interaction_date`, `interactions`.`type` AS `type`, `interactions`.`direction` AS `direction`, `interactions`.`sentiment` AS `sentiment`, count(0) AS `interaction_count`, avg(`interactions`.`duration`) AS `avg_duration` FROM `interactions` WHERE `interactions`.`date` >= curdate() - interval 30 day GROUP BY cast(`interactions`.`date` as date), `interactions`.`type`, `interactions`.`direction`, `interactions`.`sentiment` ORDER BY cast(`interactions`.`date` as date) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `interaction_summary`
--
DROP TABLE IF EXISTS `interaction_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `interaction_summary`  AS SELECT `i`.`id` AS `id`, `i`.`customer_id` AS `customer_id`, `i`.`type` AS `type`, `i`.`subject` AS `subject`, `i`.`description` AS `description`, `i`.`direction` AS `direction`, `i`.`channel` AS `channel`, `i`.`date` AS `date`, `i`.`duration` AS `duration`, `i`.`outcome` AS `outcome`, `i`.`sentiment` AS `sentiment`, `i`.`performed_by` AS `performed_by`, `c`.`name` AS `customer_name`, `c`.`email` AS `customer_email`, `c`.`segment` AS `customer_segment`, `u`.`name` AS `performed_by_name`, count(`ia`.`id`) AS `attachment_count`, count(`it`.`id`) AS `tag_count`, count(`if2`.`id`) AS `follow_up_count` FROM (((((`interactions` `i` left join `customers` `c` on(`i`.`customer_id` = `c`.`id`)) left join `users` `u` on(`i`.`performed_by` = `u`.`id`)) left join `interaction_attachments` `ia` on(`i`.`id` = `ia`.`interaction_id`)) left join `interaction_tags` `it` on(`i`.`id` = `it`.`interaction_id`)) left join `interaction_follow_ups` `if2` on(`i`.`id` = `if2`.`interaction_id`)) GROUP BY `i`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `sales_pipeline_report`
--
DROP TABLE IF EXISTS `sales_pipeline_report`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sales_pipeline_report`  AS SELECT `d`.`id` AS `deal_id`, `d`.`title` AS `deal_title`, `c`.`name` AS `customer_name`, `c`.`segment` AS `customer_segment`, `u`.`name` AS `sales_person`, `ps`.`name` AS `current_stage`, `ps`.`stage_order` AS `stage_order`, `d`.`total_value` AS `total_value`, `d`.`probability` AS `probability`, `d`.`expected_close_date` AS `expected_close_date`, `d`.`current_stage_entered_at` AS `current_stage_entered_at`, `d`.`next_follow_up_date` AS `next_follow_up_date`, to_days(current_timestamp()) - to_days(`d`.`current_stage_entered_at`) AS `days_in_current_stage`, CASE WHEN `d`.`expected_close_date` < current_timestamp() AND `ps`.`code` not in ('closed_won','closed_lost') THEN 'overdue' WHEN `d`.`expected_close_date` <= current_timestamp() + interval 7 day AND `ps`.`code` not in ('closed_won','closed_lost') THEN 'due_soon' ELSE 'on_track' END AS `status`, `d`.`created_at` AS `created_at`, `d`.`updated_at` AS `updated_at` FROM (((`deals` `d` left join `customers` `c` on(`d`.`customer_id` = `c`.`id`)) left join `users` `u` on(`d`.`assigned_to` = `u`.`id`)) left join `pipeline_stages` `ps` on(`d`.`stage_id` = `ps`.`id`)) ORDER BY `ps`.`stage_order` ASC, `d`.`created_at` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `sales_statistics`
--
DROP TABLE IF EXISTS `sales_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `sales_statistics`  AS SELECT cast(`s`.`sale_date` as date) AS `sale_date`, count(0) AS `total_sales`, sum(`s`.`total_amount`) AS `total_revenue`, avg(`s`.`total_amount`) AS `average_sale_value`, `u`.`name` AS `sales_person`, `u`.`id` AS `sales_person_id` FROM (`sales` `s` left join `users` `u` on(`s`.`sales_person_id` = `u`.`id`)) GROUP BY cast(`s`.`sale_date` as date), `u`.`id`, `u`.`name` ORDER BY cast(`s`.`sale_date` as date) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `user_interaction_performance`
--
DROP TABLE IF EXISTS `user_interaction_performance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_interaction_performance`  AS SELECT `u`.`id` AS `user_id`, `u`.`name` AS `user_name`, `u`.`role` AS `role`, count(`i`.`id`) AS `total_interactions`, count(case when `i`.`sentiment` = 'positive' then 1 end) AS `positive_interactions`, count(case when `i`.`sentiment` = 'negative' then 1 end) AS `negative_interactions`, avg(`i`.`duration`) AS `avg_interaction_duration`, count(case when `i`.`type` = 'phone' then 1 end) AS `phone_interactions`, count(case when `i`.`type` = 'email' then 1 end) AS `email_interactions`, count(case when `i`.`type` = 'chat' then 1 end) AS `chat_interactions` FROM (`users` `u` left join `interactions` `i` on(`u`.`id` = `i`.`performed_by`)) WHERE `u`.`role` <> 'ceo' GROUP BY `u`.`id` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `alerts`
--
ALTER TABLE `alerts`
  ADD CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alerts_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alerts_ibfk_3` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD CONSTRAINT `calendar_events_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calendar_events_ibfk_2` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calendar_events_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `calendar_events_ibfk_4` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_last_message` FOREIGN KEY (`last_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_groups`
--
ALTER TABLE `chat_groups`
  ADD CONSTRAINT `chat_groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_group_members`
--
ALTER TABLE `chat_group_members`
  ADD CONSTRAINT `chat_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `chat_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_participants`
--
ALTER TABLE `chat_participants`
  ADD CONSTRAINT `chat_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_reactions`
--
ALTER TABLE `chat_reactions`
  ADD CONSTRAINT `chat_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contacts_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `contact_activities`
--
ALTER TABLE `contact_activities`
  ADD CONSTRAINT `contact_activities_ibfk_1` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contact_activities_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contact_activities_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contact_activities_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_health`
--
ALTER TABLE `customer_health`
  ADD CONSTRAINT `customer_health_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_journey`
--
ALTER TABLE `customer_journey`
  ADD CONSTRAINT `customer_journey_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `customer_journey_ibfk_2` FOREIGN KEY (`stage_id`) REFERENCES `customer_journey_stages` (`id`),
  ADD CONSTRAINT `customer_journey_ibfk_3` FOREIGN KEY (`interaction_id`) REFERENCES `interactions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customer_tags`
--
ALTER TABLE `customer_tags`
  ADD CONSTRAINT `customer_tags_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
