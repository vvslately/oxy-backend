/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `featured` tinyint(1) DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `priority` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_phone` varchar(20) NOT NULL,
  `site_name` varchar(100) DEFAULT NULL,
  `site_logo` varchar(255) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `meta_keywords` varchar(500) DEFAULT NULL,
  `meta_author` varchar(100) DEFAULT NULL,
  `discord_link` varchar(255) DEFAULT NULL,
  `discord_webhook` varchar(255) DEFAULT NULL,
  `banner_link` varchar(255) DEFAULT NULL,
  `banner2_link` varchar(255) DEFAULT NULL,
  `banner3_link` varchar(255) DEFAULT NULL,
  `navigation_banner_1` varchar(255) DEFAULT NULL,
  `navigation_link_1` varchar(255) DEFAULT NULL,
  `navigation_banner_2` varchar(255) DEFAULT NULL,
  `navigation_link_2` varchar(255) DEFAULT NULL,
  `navigation_banner_3` varchar(255) DEFAULT NULL,
  `navigation_link_3` varchar(255) DEFAULT NULL,
  `navigation_banner_4` varchar(255) DEFAULT NULL,
  `navigation_link_4` varchar(255) DEFAULT NULL,
  `background_image` varchar(255) DEFAULT NULL,
  `footer_image` varchar(255) DEFAULT NULL,
  `load_logo` varchar(255) DEFAULT NULL,
  `footer_logo` varchar(255) DEFAULT NULL,
  `theme` varchar(255) DEFAULT NULL,
  `font_select` varchar(100) DEFAULT 'Prompt',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ad_banner` varchar(255) DEFAULT NULL,
  `bank_account_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_account_name_thai` varchar(100) DEFAULT NULL,
  `promptpay_number` varchar(50) DEFAULT NULL COMMENT 'หมายเลขพร้อมเพย์',
  `promptpay_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อบัญชีพร้อมเพย์',
  `line_cookie` text COMMENT 'ค่า cookie ที่ใช้ดึงรายการจาก LINE',
  `line_mac` text COMMENT 'ค่า mac (HMAC) ที่ใช้กับ LINE API',
  `verify_token` varchar(255) DEFAULT NULL COMMENT 'token ใช้ยืนยันฝั่ง server หรือ security key',
  `last_check` datetime DEFAULT NULL COMMENT 'เวลาที่ตรวจสอบล่าสุด',
  `auto_verify_enabled` tinyint(1) DEFAULT '1' COMMENT 'เปิด/ปิดระบบตรวจสอบอัตโนมัติ',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `product_stock`;
CREATE TABLE `product_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `license_key` varchar(255) NOT NULL,
  `sold` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `subtitle` text,
  `price` decimal(10,2) NOT NULL,
  `reseller_price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `duration` varchar(50) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `download_link` varchar(1000) DEFAULT NULL,
  `isSpecial` tinyint(1) DEFAULT '0',
  `featured` tinyint(1) DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `isWarrenty` tinyint(1) DEFAULT '0',
  `warrenty_text` varchar(1000) DEFAULT NULL,
  `primary_color` char(7) DEFAULT NULL,
  `secondary_color` char(7) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `priority` int NOT NULL DEFAULT '0',
  `discount_percent` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `products_chk_1` CHECK ((`discount_percent` between 0 and 100))
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `review_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rating` tinyint unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_user_id` (`user_id`),
  KEY `idx_reviews_created_at` (`created_at`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rank_name` varchar(100) NOT NULL,
  `can_edit_categories` tinyint(1) DEFAULT '0',
  `can_edit_products` tinyint(1) DEFAULT '0',
  `can_edit_users` tinyint(1) DEFAULT '0',
  `can_edit_orders` tinyint(1) DEFAULT '0',
  `can_manage_keys` tinyint(1) DEFAULT '0',
  `can_view_reports` tinyint(1) DEFAULT '0',
  `can_manage_promotions` tinyint(1) DEFAULT '0',
  `can_manage_settings` tinyint(1) DEFAULT '0',
  `can_access_reseller_price` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `theme_settings`;
CREATE TABLE `theme_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `primary_color` varchar(7) NOT NULL,
  `secondary_color` varchar(7) NOT NULL,
  `background_color` varchar(7) NOT NULL,
  `text_color` varchar(7) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `theme_mode` varchar(10) DEFAULT 'light',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `topups`;
CREATE TABLE `topups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(50) NOT NULL,
  `transaction_ref` varchar(100) DEFAULT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_topups_user_id` (`user_id`),
  CONSTRAINT `topups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `transaction_items`;
CREATE TABLE `transaction_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(50) NOT NULL,
  `transaction_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `license_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transaction_items_transaction_id` (`transaction_id`),
  KEY `idx_transaction_items_product_id` (`product_id`),
  KEY `transaction_items_ibfk_3` (`license_id`),
  CONSTRAINT `transaction_items_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_items_ibfk_3` FOREIGN KEY (`license_id`) REFERENCES `product_stock` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_user_id` (`user_id`),
  KEY `idx_transactions_created_at` (`created_at`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(50) DEFAULT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `money` decimal(10,2) DEFAULT '0.00',
  `points` int DEFAULT '0',
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `promptpay_qr_code`;
CREATE TABLE `promptpay_qr_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `qr_payload` text NOT NULL,
  `qr_image` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_amount` (`amount`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `promptpay_qr_code_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `categories` (`id`, `parent_id`, `title`, `subtitle`, `image`, `category`, `featured`, `isActive`, `priority`, `created_at`) VALUES
(1, NULL, 'รหัสเปลี่ยนได้ Fortnite', 'Category for modelv', 'https://img5.pic.in.th/file/secure-sv1/f-bb-1.png', 'fortnite-nfa', 1, 1, 1111, '2025-10-24 18:24:15'),
(82, NULL, 'LINE RANGER', NULL, 'https://img5.pic.in.th/file/secure-sv1/LR-BB.png', NULL, 0, 1, 0, '2025-11-06 15:53:27'),
(83, NULL, 'รหัส Roblox ', NULL, 'https://img2.pic.in.th/pic/rh-bb.png', NULL, 0, 1, 0, '2025-11-06 15:53:42'),
(84, NULL, 'รหัส Steam', '', 'https://img2.pic.in.th/pic/ST-BB.png', NULL, 0, 1, 11, '2025-11-06 15:53:52');
INSERT INTO `config` (`id`, `owner_phone`, `site_name`, `site_logo`, `meta_title`, `meta_description`, `meta_keywords`, `meta_author`, `discord_link`, `discord_webhook`, `banner_link`, `banner2_link`, `banner3_link`, `navigation_banner_1`, `navigation_link_1`, `navigation_banner_2`, `navigation_link_2`, `navigation_banner_3`, `navigation_link_3`, `navigation_banner_4`, `navigation_link_4`, `background_image`, `footer_image`, `load_logo`, `footer_logo`, `theme`, `font_select`, `created_at`, `updated_at`, `ad_banner`, `bank_account_name`, `bank_account_number`, `bank_account_name_thai`, `promptpay_number`, `promptpay_name`, `line_cookie`, `line_mac`, `verify_token`, `last_check`, `auto_verify_enabled`) VALUES
(43, '0843460416', 'OXY STORE', 'https://img5.pic.in.th/file/secure-sv1/oxy_logo__5_-removebg-preview-1.png', '(⭐) death - Digital Store', 'Welcome to death - Your trusted digital products store', 'digital, products, store, gaming', '🌿 ยินดีต้อนรับสู่เว็บใหม่ของเรา ส่วนลด 20% ทั้งร้าน', 'https://discord.gg/WuypB7CFZN', 'https://discord.com/api/webhooks/1436026763699425357/-zbdI3YxEk8kGpFOWtlZshARDZ_GtmYr6Cxrf9zXsZj6J7-z-rxC13X1nuO0C7Tqtwk8', 'https://img2.pic.in.th/pic/55ed7df70e58681935.png', 'https://img2.pic.in.th/pic/55ed7df70e58681935.png', 'https://img2.pic.in.th/pic/55ed7df70e58681935.png', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', 'https://discord.gg/kiddy', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', 'https://modelv.vhouse.online/store', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', NULL, 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', NULL, '', NULL, NULL, NULL, 'Dark mode', 'THAIRG', '2025-10-10 14:47:09', '2025-11-06 16:18:05', 'https://img5.pic.in.th/file/secure-sv1/1500x1500232d3d161739dfd2.png', 'MISS FAHSAI SANGEAMNGAM', '156-3-52409-6', 'นางสาว ฟ้าใส เสงี่ยมงาม', '0812345678', 'Test Store', 'test_cookie', 'test_mac', 'test_token', NULL, 1);
INSERT INTO `product_stock` (`id`, `product_id`, `license_key`, `sold`, `created_at`) VALUES
(1103, 1, 'EPICGAMES (arakelian-3yi0k@rambler.ru:5mJgLTUp) MAIL (arakelian-3yi0k@rambler.ru:eCTyB6DXeSLU) (https://mail.rambler.ru/)', 1, '2025-11-05 16:06:44'),
(1104, 1, 'EPICGAMES (lindarobinson1961@ebullmail.ru:tAw9o9pw) MAIL (lindarobinson1961@ebullmail.ru:OOvpBLJsp3)  (https://firstmail.ltd/webmail)', 1, '2025-11-05 16:11:13'),
(1105, 1, 'EPICGAMES (mskrqlppaz@rambler.ru:w3e4tg3w4eft43e) MAIL (mskrqlppaz@rambler.ru:2256975cE9xjZ) (https://mail.rambler.ru/)', 1, '2025-11-05 16:11:49'),
(1106, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1107, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1108, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1109, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1110, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1111, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1112, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1113, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1114, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1115, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1116, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1117, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1118, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1119, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1120, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1121, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1122, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1123, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1124, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1125, 92, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:03:46'),
(1126, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1127, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1128, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1129, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1130, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1131, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1132, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1133, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1134, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1135, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1136, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33'),
(1137, 93, 'กุรณาติดต่อรับสินค้าที่ : https://discord.gg/WuypB7CFZN', 0, '2025-11-06 16:13:33');
INSERT INTO `products` (`id`, `category_id`, `title`, `subtitle`, `price`, `reseller_price`, `stock`, `duration`, `image`, `download_link`, `isSpecial`, `featured`, `isActive`, `isWarrenty`, `warrenty_text`, `primary_color`, `secondary_color`, `created_at`, `priority`, `discount_percent`) VALUES
(1, 1, 'สุ่มสกิน Juice Wrld', 'การันตีสกิน SLAYER JUCIE WORLD', '77.00', '0.00', 3, '', 'https://img5.pic.in.th/file/secure-sv1/jw.jpg', '', 1, 1, 1, 1, 'รับประกันถาวร', '#37ff00', '', '2025-10-24 19:56:50', 0, 0),
(92, 1, 'ไอดีการันตีสกิน 50 สกิน', 'การันตีว่ามีสกิน 50 สกินขึ้นไปแน่นอน (หลังซื้อให้ติดต่อแอดมินเท่านั้น ห้ามเร่ง หรือ รีบ) ', '499.00', '0.00', 20, NULL, 'https://img2.pic.in.th/pic/psd-fortnite.jpg', NULL, 1, 1, 1, 0, '', NULL, NULL, '2025-11-06 16:03:14', 0, 0),
(93, 1, 'ไอดีการันตี 100 สกิน', 'การันตีว่ามีสกิน 100 สกินขึ้นไปแน่นอน (หลังซื้อให้ติดต่อแอดมินเท่านั้น ห้ามเร่ง หรือ รีบ)', '799.00', '0.00', 12, NULL, 'https://img2.pic.in.th/pic/psd-fortnite.png', NULL, 1, 1, 1, 0, '', NULL, NULL, '2025-11-06 16:12:45', 0, 0);
INSERT INTO `reviews` (`id`, `user_id`, `review_text`, `rating`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 67, 'ดีมาก', 5, 1, '2025-10-25 13:23:03', '2025-10-25 13:23:03');
INSERT INTO `roles` (`id`, `rank_name`, `can_edit_categories`, `can_edit_products`, `can_edit_users`, `can_edit_orders`, `can_manage_keys`, `can_view_reports`, `can_manage_promotions`, `can_manage_settings`, `can_access_reseller_price`, `created_at`) VALUES
(49, 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 0, '2025-10-08 12:06:11');
INSERT INTO `theme_settings` (`id`, `primary_color`, `secondary_color`, `background_color`, `text_color`, `updated_at`, `theme_mode`) VALUES
(47, '#8C30FE', '#52378A', '#000000', '#ffffff', '2025-10-24 17:07:10', 'dark');
INSERT INTO `topups` (`id`, `user_id`, `amount`, `method`, `transaction_ref`, `status`, `created_at`, `updated_at`) VALUES
(6, 71, '77.00', 'angpao', 'Campaign: 019a58c8886a71a6b1f6f9f30a88890bdat', 'success', '2025-11-06 10:49:27', '2025-11-06 10:49:27'),
(7, 73, '77.00', 'angpao', 'Campaign: 019a59a7e38f718651ba7c73783af69f2bC', 'success', '2025-11-06 14:54:05', '2025-11-06 14:54:05'),
(8, 74, '80.00', 'angpao', 'Campaign: 019a5a1574a077a0b1eaee9a2fd512930cO', 'success', '2025-11-06 16:52:52', '2025-11-06 16:52:52');
INSERT INTO `transaction_items` (`id`, `bill_number`, `transaction_id`, `product_id`, `quantity`, `price`, `created_at`, `license_id`) VALUES
(31, 'BILL1762426200355334', 31, 1, 1, '77.00', '2025-11-06 10:50:00', 1103),
(32, 'BILL1762440873093499', 32, 1, 1, '77.00', '2025-11-06 14:54:33', 1104),
(33, 'BILL1762447983326087', 33, 1, 1, '77.00', '2025-11-06 16:53:03', 1105);
INSERT INTO `transactions` (`id`, `bill_number`, `user_id`, `total_price`, `created_at`, `updated_at`) VALUES
(31, 'BILL1762426200355334', 71, '77.00', '2025-11-06 10:50:00', '2025-11-06 10:50:00'),
(32, 'BILL1762440873093499', 73, '77.00', '2025-11-06 14:54:33', '2025-11-06 14:54:33'),
(33, 'BILL1762447983326087', 74, '77.00', '2025-11-06 16:53:03', '2025-11-06 16:53:03');
INSERT INTO `users` (`id`, `discord_id`, `fullname`, `email`, `password`, `money`, `points`, `role`, `created_at`) VALUES
(67, NULL, 'ธีรโชติ เนื่องสนธิ', 'Teerachat20005@gmail.com', '$2b$10$D9NoI/u.YJlArIuO2ygJVebiJqafzkqPLIn1RfQwUNDjx9QDwOnR.', '833.00', 0, 'admin', '2025-10-24 18:38:18'),
(68, NULL, 'solee', 'Disijksks@gmail.com', '$2b$10$wwp9f2UF8H1.dRIEF0Z47.t2mpu7O00dyP3570NoBDvP0/kYRAY8m', '0.00', 0, 'member', '2025-11-03 22:43:41'),
(69, NULL, 'szxrxq', 'zxbaiioo044@gmail.com', '$2b$10$pHSlIey0pY3yB1Y6JFeInOiMCypqdiVFEHJvmPvUJtjJUQUNKyxk.', '0.00', 0, 'member', '2025-11-05 06:44:26'),
(70, NULL, 'ธีรโชติ', 'teerachat20008@gmail.com', '$2b$10$1hvaaoN.Iq5Ex2.Tly1F4esLDzpml9m03TqgWXElovrVDBXH6..ZG', '0.00', 0, 'member', '2025-11-05 16:17:22'),
(71, NULL, 'natdanai tinnakon', 'newsnail081@gmail.com', '$2b$10$up.Q5mNUcStKxT9EXthRR.xMt.mFpudWr1P3l8GQWo7z.Rnv6OhN6', '0.00', 0, 'member', '2025-11-06 10:45:33'),
(72, NULL, 'รณชัย พริกภิรมย์', 'xlnwxb7@gmail.com', '$2b$10$KjZBoRNwk77wDJWKY3cN0.X8xaRL5n91Hz3EkM8t0J0X5WdoQ3FOq', '0.00', 0, 'member', '2025-11-06 12:37:23'),
(73, NULL, 'Jackpot Areno', 'krd.flookz@gmail.com', '$2b$10$LZCyKrsMS5UzveD0QrhIiu1/TyM6MM3SgNGCJNi4ao87o6T.qp/1O', '0.00', 0, 'member', '2025-11-06 14:45:29'),
(74, NULL, 'Sss Pat', 'siraphatkaewsap@gmail.com', '$2b$10$4wX5R11dp9JQKZSo0SK3R.XYRQ4nZC4fHU3mYdvI7QXjqEupzzuOe', '3.00', 0, 'member', '2025-11-06 16:51:56'),
(75, NULL, 'Fam mozy', 'famanaconda@gmail.com', '$2b$10$nLfCS7DAWvodk0LXfzXYie85NUfujOJvWdAmkHinZLXBnnVAthscy', '0.00', 0, 'member', '2025-11-06 17:15:03');


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;