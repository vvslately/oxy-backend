/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `auth_sites`;
CREATE TABLE `auth_sites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
  `website_name` varchar(150) NOT NULL,
  `admin_user` varchar(100) NOT NULL,
  `admin_password` varchar(255) NOT NULL,
  `expiredDay` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_customer` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
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
  `customer_id` varchar(100) NOT NULL,
  `product_id` int NOT NULL,
  `license_key` varchar(255) NOT NULL,
  `sold` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1044 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `promptpay_payments`;
CREATE TABLE `promptpay_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL COMMENT 'รหัสร้าน / tenant',
  `user_id` varchar(100) NOT NULL COMMENT 'รหัสผู้ใช้ในระบบ',
  `amount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่ต้องชำระ',
  `qr_code` text COMMENT 'QR Code สำหรับชำระเงิน',
  `status` enum('pending','verified','failed','expired') DEFAULT 'pending' COMMENT 'สถานะการชำระเงิน',
  `transaction_id` varchar(100) DEFAULT NULL COMMENT 'รหัสธุรกรรมจาก LINE',
  `verified_at` datetime DEFAULT NULL COMMENT 'เวลาที่ยืนยันการชำระเงิน',
  `expires_at` datetime DEFAULT NULL COMMENT 'เวลาหมดอายุ',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้างรายการ',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'เวลาที่อัปเดตล่าสุด',
  PRIMARY KEY (`id`),
  KEY `idx_customer_user` (`customer_id`,`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตารางเก็บรายการชำระเงิน PromptPay';

DROP TABLE IF EXISTS `resell_config`;
CREATE TABLE `resell_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) NOT NULL,
  `owner_name` varchar(100) NOT NULL,
  `owner_bank` varchar(100) NOT NULL,
  `website_name` varchar(100) NOT NULL,
  `Model1_price` decimal(10,2) NOT NULL,
  `Model1_resell_price` decimal(10,2) NOT NULL,
  `Model1_name` varchar(100) NOT NULL,
  `Model1_1500x1500Banner` text,
  `Model1_2000x500Banner` text,
  `Model1_1000x500Banner` text,
  `Model1_1640x500Banner` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `resell_topup_history`;
CREATE TABLE `resell_topup_history` (
  `topup_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `method` enum('bank','wallet','card') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `slip_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`topup_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `resell_topup_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `resell_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `resell_transactions`;
CREATE TABLE `resell_transactions` (
  `transac_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('purchase','withdraw','transfer') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transac_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `resell_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `resell_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `resell_users`;
CREATE TABLE `resell_users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `role` enum('admin','user','moderator') DEFAULT 'user',
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `review_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rating` tinyint unsigned DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_customer_id` (`customer_id`),
  KEY `idx_reviews_user_id` (`user_id`),
  KEY `idx_reviews_created_at` (`created_at`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
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
  `customer_id` varchar(100) NOT NULL,
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
  `customer_id` varchar(100) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `transaction_items`;
CREATE TABLE `transaction_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
  `bill_number` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_user_id` (`user_id`),
  KEY `idx_transactions_created_at` (`created_at`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(100) NOT NULL,
  `discord_id` varchar(50) DEFAULT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `money` decimal(10,2) DEFAULT '0.00',
  `points` int DEFAULT '0',
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'member',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `auth_sites` (`id`, `customer_id`, `website_name`, `admin_user`, `admin_password`, `expiredDay`, `created_at`) VALUES
(60, '8', 'modelv', 'modelv446681', '438ebbe4af5ef73a022863e3ccfb986a:207ab0bd5501e16f1d760ebfb1a1c333', '2025-11-08', '2025-10-08 12:06:09'),
(64, '9', 'death', 'death299265', 'ac50b1f598c5c25e7eb0f02ecb1b6597:9a3cdd80976fac77b4d210ad3892b7f3', '2025-11-11', '2025-10-10 14:47:05'),
(65, '10', 'reaplnwstorex2', 'reaplnwstorex2728342', '816cea0637752076181583d0235b4ee4:b53bf0bc2b9cb915096916445ebe9245', '2025-11-14', '2025-10-14 15:23:01'),
(66, '11', 'kiddyxstore', 'kiddyxstore628379', 'bca27ada7788972e58f395d551cf53c5:9bcc6d80fa19f3a1c6e01f1120a8890d', '2025-11-15', '2025-10-15 18:27:42');
INSERT INTO `categories` (`id`, `customer_id`, `parent_id`, `title`, `subtitle`, `image`, `category`, `featured`, `isActive`, `priority`, `created_at`) VALUES
(68, '8', NULL, 'modelv Category', 'Category for modelv', 'https://img5.pic.in.th/file/secure-sv1/Kiddyxstore-Banner-Web-FivemHub.png', 'modelv_category', 0, 1, 0, '2025-10-08 12:06:10'),
(72, '9', NULL, 'death Category', 'Category for death', 'https://img2.pic.in.th/pic/1640x500ebe7d18bc84a1cf6.png', 'death_category', 0, 1, 0, '2025-10-10 14:47:07'),
(73, '8', NULL, 'หมวดหมู่สินค้าที่ดี', 'หมวดหมู่สินค้าที่ดี', 'https://img5.pic.in.th/file/secure-sv1/Kiddyxstore-Banner-Web-Roblox.png', 'bigger', 0, 1, 0, '2025-10-14 08:00:25'),
(74, '8', NULL, 'สินค้าที่ดีอัน 1 ของไทย', 'สินค้าอันดับ 1', 'https://img5.pic.in.th/file/secure-sv1/Kiddyxstore-Banner-Web-SocialHub.png', 'rank1', 0, 1, 0, '2025-10-14 08:00:49'),
(75, '10', NULL, 'reaplnwstorex2 Category', 'Category for reaplnwstorex2', 'https://img2.pic.in.th/pic/1640x500ebe7d18bc84a1cf6.png', 'reaplnwstorex2_category', 0, 1, 0, '2025-10-14 15:23:03'),
(76, '11', NULL, 'Valorant Hub', 'ขายไอดี VALORANT ราคาถูก', 'https://img2.pic.in.th/pic/VALORANT-HUB.webp', 'Valorant Hub', 0, 1, 0, '2025-10-15 18:27:43'),
(77, '11', NULL, 'FiveM Hub', 'ขายโปร FiveM', 'https://img5.pic.in.th/file/secure-sv1/FiveMHUB.webp', 'FiveM Hub', 0, 1, 0, '2025-10-15 18:45:10'),
(78, '11', NULL, 'Roblox Hub', 'ขายไอดีเกม Roblox', 'https://img2.pic.in.th/pic/Roblox-Hub.webp', 'Roblox Hub', 0, 1, 0, '2025-10-15 18:46:08'),
(79, '11', NULL, 'Rov Hub', 'ขายไอดีเกม ROV เปลี่ยนไม่ได้ราคาถูก', 'https://img2.pic.in.th/pic/RovHub.webp', 'Rov Hub', 0, 1, 0, '2025-10-15 18:47:02'),
(80, '11', NULL, 'Social Hub', 'Social Hub', 'https://img5.pic.in.th/file/secure-sv1/SocialHub.webp', 'Social Hub', 0, 1, 0, '2025-10-15 18:47:53'),
(81, '11', NULL, 'Unban Hub', 'โปรแกรมปลดแบนทุกรูปแบบ', 'https://img5.pic.in.th/file/secure-sv1/UnbanHub.webp', 'Unban Hub', 0, 1, 0, '2025-10-15 18:49:24');
INSERT INTO `config` (`id`, `customer_id`, `owner_phone`, `site_name`, `site_logo`, `meta_title`, `meta_description`, `meta_keywords`, `meta_author`, `discord_link`, `discord_webhook`, `banner_link`, `banner2_link`, `banner3_link`, `navigation_banner_1`, `navigation_link_1`, `navigation_banner_2`, `navigation_link_2`, `navigation_banner_3`, `navigation_link_3`, `navigation_banner_4`, `navigation_link_4`, `background_image`, `footer_image`, `load_logo`, `footer_logo`, `theme`, `font_select`, `created_at`, `updated_at`, `ad_banner`, `bank_account_name`, `bank_account_number`, `bank_account_name_thai`, `promptpay_number`, `promptpay_name`, `line_cookie`, `line_mac`, `verify_token`, `last_check`, `auto_verify_enabled`) VALUES
(39, '8', '0000000000', 'modelv', 'https://img2.pic.in.th/pic/logodiscordf124e71a99293428.png', '(⭐) modelv - Digital Store', 'Welcome to modelv - Your trusted digital products store', 'digital, products, store, gaming', 'เว็บขายสินค้าที่ดีที่สุด', 'discord.gg/kiddy', NULL, 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img5.pic.in.th/file/secure-sv1/admin7fb28187425843cd.png', 'https://discord.gg/kiddy', 'https://img2.pic.in.th/pic/review803654e30f3a3d94.png', 'https://modelv.vhouse.online/store', 'https://img5.pic.in.th/file/secure-sv1/shopping3629d6b65f35e02b.png', 'https://modelv.vhouse.online/store', 'https://img2.pic.in.th/pic/Topupdffe642023c882e1.png', 'https://modelv.vhouse.online/topup', '', NULL, 'https://img2.pic.in.th/pic/logodiscordf124e71a99293428.png', NULL, 'Dark mode', 'THAIRG', '2025-10-08 12:06:13', '2025-10-23 17:49:14', 'https://img2.pic.in.th/pic/Untitled-2e1163155a929c6b9.webp', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 1),
(43, '9', '0000000000', 'death', '', '(⭐) death - Digital Store', 'Welcome to death - Your trusted digital products store', 'digital, products, store, gaming', 'death Admin', NULL, NULL, 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img2.pic.in.th/pic/2000x500172fb60914209eb0.png', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', 'https://discord.gg/kiddy', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', 'https://modelv.vhouse.online/store', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', NULL, 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', NULL, '', NULL, NULL, NULL, 'Dark mode', 'THAIRG', '2025-10-10 14:47:09', '2025-10-23 17:49:13', 'https://img5.pic.in.th/file/secure-sv1/1500x1500232d3d161739dfd2.png', 'MISS FAHSAI SANGEAMNGAM', '156-3-52409-6', 'นางสาว ฟ้าใส เสงี่ยมงาม', '0812345678', 'Test Store', 'test_cookie', 'test_mac', 'test_token', NULL, 1),
(44, '10', '0621230686', 'reaplnwstorex2', 'https://img5.pic.in.th/file/secure-sv1/PNG5b50b119ec993239.md.png', '(⭐) reaplnwstorex2 - Program Hack', 'ผู้ให้บริการโปรVALORANT ครบจบทุกฟังก์ชั่น ราคาถูกและคุ้มค่า ใช้งานได้จริงไม่ผิดหวังแน่นอน', 'reaplnw,reap,lnw,reaplnwstore,valorant,hackvalorant,โปร,โปรเเกรมช่วยเล่น,วาโลเเรน', 'ผู้ให้บริการโปรVALORANT ครบจบทุกฟังก์ชั่น ราคาถูกและคุ้มค่า ใช้งานได้จริงไม่ผิดหวังแน่นอน', 'https://discord.gg/reaplnwstore', NULL, 'https://img5.pic.in.th/file/secure-sv1/d2w.png', '', '', 'https://img5.pic.in.th/file/secure-sv1/Productdaecf2baaf9c5a03.png', 'https://reaplnwstorex2.vhouse.online/', 'https://img2.pic.in.th/pic/Topupc4b4ea8c72f4d38f.png', 'https://reaplnwstorex2.vhouse.online/topup', 'https://img5.pic.in.th/file/secure-sv1/History3290793867aba6bc.png', 'https://reaplnwstorex2.vhouse.online/history', 'https://img2.pic.in.th/pic/Contact67bf96d3fc0504ed.png', 'https://discord.gg/reaplnwstore', NULL, NULL, 'https://img5.pic.in.th/file/secure-sv1/PNG5b50b119ec993239.md.png', 'https://img5.pic.in.th/file/secure-sv1/PNG5b50b119ec993239.md.png', 'Dark mode', 'Prompt', '2025-10-14 15:23:06', '2025-10-14 16:11:12', 'https://img2.pic.in.th/pic/Posterd887b902ff0133fd.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1),
(45, '11', '0825204562', 'kiddyxstore', 'https://img2.pic.in.th/pic/logodiscordf124e71a99293428.png', '(⭐) kiddyxstore - Digital Store', 'ขายรหัสเกม VALORANT, ROV, FiveM, Discord, Steam, Rockstar ราคาถูก ปลอดภัย ส่งไว มีบริการปลดแบนเกมและ FiveM ติดต่อผ่าน Ticket ได้ทันที', 'รหัส VALORANT, VALORANT account, ขายไอดีเกม, Discord account, Rockstar account, Steam account, ปลดแบนเกม, ปลดแบน FiveM, FiveM account, รหัส ROV, ROV account, ขายไอดี, รหัส VALORANT, ขายไอดี ROV, FiveM account, Discord account, Rockstar account, Steam account, ขายไอดีเกม, ปลดแบน FiveM, ปลดแบนเกม, game account marketplace', 'ร้านขายไอดี Rov Valorant FiveM Steam ทุกอย่างอันดับ 1 ของไทย', 'discord.gg/kiddy', 'https://discord.com/api/webhooks/1421150234469466304/xk6SNes3ApKW6hgJBc9nfGvKlZKFnN5CmM99nCm6zh5_2j57tgZkf9NyCgaRHy31KIdj', 'https://img5.pic.in.th/file/secure-sv1/banner9924a3e679808591.png', 'https://img5.pic.in.th/file/secure-sv1/banner9924a3e679808591.png', 'https://img5.pic.in.th/file/secure-sv1/banner9924a3e679808591.png', 'https://img2.pic.in.th/pic/Topupdffe642023c882e1.png', 'https://kiddyxstore.vhouse.online/topup', 'https://img5.pic.in.th/file/secure-sv1/shopping3629d6b65f35e02b.png', 'https://kiddyxstore.vhouse.online/store', 'https://img2.pic.in.th/pic/review803654e30f3a3d94.png', 'https://kiddyxstore.vhouse.online/store', 'https://img5.pic.in.th/file/secure-sv1/admin7fb28187425843cd.png', 'discord.gg/kiddy', NULL, NULL, 'https://img2.pic.in.th/pic/logodiscordf124e71a99293428.png', NULL, 'Dark mode', 'THAIRG', '2025-10-15 18:27:46', '2025-10-15 20:41:15', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1);
INSERT INTO `product_stock` (`id`, `customer_id`, `product_id`, `license_key`, `sold`, `created_at`) VALUES
(1038, '8', 79, 'ddsadas', 1, '2025-10-08 12:51:42'),
(1039, '8', 79, 'dsad', 1, '2025-10-08 12:51:42'),
(1040, '8', 79, 'sadas', 0, '2025-10-08 12:51:42'),
(1041, '8', 79, 'dasdas', 0, '2025-10-08 12:51:42'),
(1042, '8', 79, 'dsadasdsa', 0, '2025-10-08 12:51:42'),
(1043, '11', 91, 'szpo147:kittakan5014', 0, '2025-10-15 20:49:36');
INSERT INTO `products` (`id`, `customer_id`, `category_id`, `title`, `subtitle`, `price`, `reseller_price`, `stock`, `duration`, `image`, `download_link`, `isSpecial`, `featured`, `isActive`, `isWarrenty`, `warrenty_text`, `primary_color`, `secondary_color`, `created_at`, `priority`, `discount_percent`) VALUES
(84, '8', 68, 'Sample Product', '- สินค้าทั่วไป', '10.00', '5.00', 0, '', 'https://img5.pic.in.th/file/secure-sv1/Product-ROV-1.webp', '', 0, 1, 1, 1, 'รับประกันถาวร', '#37ff00', '', '2025-10-14 07:56:54', 0, 0),
(89, '11', 79, 'Rov ของโครตเยอะโครตคุ้ม', '🔑 สินค้ารหัส ROV นี้โครตคุ้ม\n• เล่นได้หมดไม่สนลูกใครของเยอะคุ้มระดับปีศาจ\n• ราคา 99 บาทแต่ได้รหัสหลักหมื่นบาทเลยไม่เวอร์เกินไปแต่ของจริงแท้แน่นอน   \n\n✅ รายละเอียด\n• เปลี่ยนไม่ได้เมลเบอร์ตาย \n• ล็อคซ้อนไม่มีประกัน \n• รับประกันของเยอะแน่นอน ของน้อยมาเคลมสินค้าใหม่ได้เลย', '99.00', '60.00', 0, '', 'https://img2.pic.in.th/pic/Product-ROV-2-1.webp', '', 0, 0, 1, 1, 'รับประกัน', '#00ff04', '', '2025-10-15 18:53:35', 10, 0),
(90, '11', 79, 'Rov ของคุ้มระดับกลาง', '🔑 สินค้ารหัส ROV นี้โครตคุ้ม \n• เล่นได้หมดไม่สนลูกใครของเยอะคุ้มระดับปีศาจ \n• ราคา 50 บาทแต่ได้รหัสหลักหมื่นบาทเลยไม่เวอร์เกินไปแต่ของจริงแท้แน่นอน   \n\n✅ รายละเอียด \n• เปลี่ยนไม่ได้เมลเบอร์ตาย \n• ล็อคซ้อนไม่มีประกัน \n• รับประกันของเยอะแน่นอน ของน้อยมาเคลมสินค้าใหม่ได้เลย', '50.00', '30.00', 0, '', 'https://img5.pic.in.th/file/secure-sv1/Product-ROV-1.webp', '', 0, 0, 1, 1, 'รับประกัน', '', '', '2025-10-15 18:59:56', 11, 0),
(91, '11', 79, 'ID 1 ( โครตคุ้ม )', '🔑 สินค้ารหัส ROV นี้โครตคุ้ม \n• เล่นได้หมดไม่สนลูกใครของเยอะคุ้มระดับปีศาจ\n\n✅ รายละเอียด \n• เปลี่ยนไม่ได้เมลเบอร์ตาย \n• ล็อคซ้อนไม่มีประกัน \n• รับประกันของเยอะแน่นอน ของน้อยมาเคลมสินค้าใหม่ได้เลย', '199.00', NULL, 1, NULL, 'https://img2.pic.in.th/pic/ID-1.webp', NULL, 0, 0, 1, 0, NULL, NULL, NULL, '2025-10-15 20:46:55', 0, 0);
INSERT INTO `promptpay_payments` (`id`, `customer_id`, `user_id`, `amount`, `qr_code`, `status`, `transaction_id`, `verified_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, '9', 'test_user', '100.00', '00020101021229370016A0000006770101110113006608123456780253037645802TH5406100.0053037646304', 'expired', NULL, NULL, '2025-10-19 19:26:42', '2025-10-19 12:11:41', '2025-10-19 19:46:11'),
(3, '9', '59', '50.00', '00020101021229370016A0000006770101110113006608123456780253037645802TH540650.0053037646304', 'expired', NULL, NULL, '2025-10-19 19:50:52', '2025-10-19 12:35:51', '2025-10-19 19:51:10'),
(4, '9', '59', '50.00', '00020101021229370016A0000006770101110113006608123456780253037645802TH540650.0053037646304', 'expired', NULL, NULL, '2025-10-24 00:58:35', '2025-10-23 17:43:35', '2025-10-24 00:58:37'),
(5, '9', '59', '50.00', '00020101021229370016A0000006770101110113006608123456780253037645802TH540650.0053037646304', 'expired', NULL, NULL, '2025-10-24 01:26:50', '2025-10-23 18:11:50', '2025-10-24 01:27:07');
INSERT INTO `resell_config` (`id`, `phone_number`, `owner_name`, `owner_bank`, `website_name`, `Model1_price`, `Model1_resell_price`, `Model1_name`, `Model1_1500x1500Banner`, `Model1_2000x500Banner`, `Model1_1000x500Banner`, `Model1_1640x500Banner`, `created_at`, `updated_at`) VALUES
(1, '0843460416', 'Somchai Sang', '123-456789-0', 'somchai-store.com', '159.00', '159.00', 'ModelV', '', '', 'https://img5.pic.in.th/file/secure-sv1/1000x500.png', 'https://img2.pic.in.th/pic/1640x500ebe7d18bc84a1cf6.png', '2025-10-10 11:02:48', '2025-10-10 14:46:55');

INSERT INTO `resell_transactions` (`transac_id`, `user_id`, `type`, `amount`, `description`, `status`, `created_at`) VALUES
(42, 15, 'purchase', '200.00', 'androssy;Username: androssy954165@gmail.com;Password: REALMASA;ต่ออายุ', 'success', '2025-10-04 13:27:12'),
(43, 15, 'purchase', '200.00', 'androssy;ต่ออายุ', 'success', '2025-10-04 13:29:07'),
(44, 16, 'purchase', '200.00', 'realmasa;Username: realmasa918682@gmail.com;Password: dion;ต่ออายุ', 'success', '2025-10-04 14:07:36'),
(45, 16, 'purchase', '200.00', 'cartier;Username: cartier474135@gmail.com;Password: aaa;ต่ออายุ', 'success', '2025-10-04 14:11:09'),
(46, 16, 'purchase', '200.00', 'cartier;Username: cartier141529@gmail.com;Password: adsasdadasd;ต่ออายุ', 'success', '2025-10-04 14:15:14'),
(47, 16, 'purchase', '200.00', 'kiddyxstore;Username: kiddyxstore821203@gmail.com;Password: 0927014505za;ต่ออายุ', 'success', '2025-10-04 14:19:42'),
(48, 16, 'purchase', '200.00', 'aekwannoy;Username: aekwannoy323599@gmail.com;Password: admin;ต่ออายุ', 'success', '2025-10-04 14:25:37'),
(49, 16, 'purchase', '200.00', 'cartier;ต่ออายุ', 'success', '2025-10-04 19:28:02'),
(50, 16, 'purchase', '200.00', 'androssy;Username: androssy312091@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 19:28:25'),
(51, 16, 'purchase', '200.00', 'cartier;Username: cartier909602@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 20:23:02'),
(52, 16, 'purchase', '200.00', 'sadadads;Username: sadadads157556@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 20:30:02'),
(53, 16, 'purchase', '200.00', 'cartier;Username: cartier118993@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:01:38'),
(54, 16, 'purchase', '200.00', 'cartier;Username: cartier756776@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:41:39'),
(55, 16, 'purchase', '200.00', 'cartier;Username: cartier126214@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:42:47'),
(56, 16, 'purchase', '200.00', 'cartiergg;Username: cartiergg851538@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:48:50'),
(57, 16, 'purchase', '200.00', 'cartier;Username: cartier561356@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:49:22'),
(58, 16, 'purchase', '200.00', 'death;Username: death269136@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 21:55:42'),
(59, 16, 'purchase', '200.00', 'cacarar;Username: cacarar952112@gmail.com;Password: wanzeone234;เช่า', 'success', '2025-10-04 22:10:14'),
(60, 16, 'purchase', '200.00', 'cartier;Username: cartier934453@gmail.com;Password: admin;เช่า', 'success', '2025-10-04 22:13:20'),
(61, 16, 'purchase', '200.00', 'death;Username: death934629@gmail.com;Password: death;เช่า', 'success', '2025-10-05 10:28:19'),
(62, 16, 'purchase', '200.00', 'bosswebsite;Username: bosswebsite580472@gmail.com;Password: admin;เช่า', 'success', '2025-10-06 15:37:39'),
(63, 16, 'purchase', '200.00', 'bosswebsite;ต่ออายุ', 'success', '2025-10-06 15:39:18'),
(64, 16, 'purchase', '200.00', 'wichxgod;Username: wichxgod659120@gmail.com;Password: SecretPassword;เช่า', 'success', '2025-10-07 10:19:08'),
(65, 16, 'purchase', '200.00', 'rinny;Username: rinny456491@gmail.com;Password: password;เช่า', 'success', '2025-10-07 17:12:23'),
(66, 16, 'purchase', '200.00', 'modelv;Username: modelv446681@gmail.com;Password: admin;เช่า', 'success', '2025-10-08 12:06:10'),
(67, 16, 'purchase', '200.00', 'alonejennn;Username: alonejennn688222@gmail.com;Password: admin;เช่า', 'success', '2025-10-09 06:48:33'),
(68, 16, 'purchase', '200.00', 'jenncater;Username: jenncater845827@gmail.com;Password: admin;เช่า', 'success', '2025-10-09 09:25:46'),
(69, 16, 'purchase', '200.00', 'XXX;Username: xxx936863@gmail.com;Password: admin;เช่า', 'success', '2025-10-10 10:23:29'),
(70, 16, 'purchase', '159.00', 'death;Username: death299265@gmail.com;Password: admin;เช่า', 'success', '2025-10-10 14:47:06'),
(71, 20, 'purchase', '159.00', 'reaplnwstorex2;Username: reaplnwstorex2728342@gmail.com;Password: 123456789za;เช่า', 'success', '2025-10-14 15:23:02'),
(72, 20, 'purchase', '159.00', 'kiddyxstore;Username: kiddyxstore628379@gmail.com;Password: 0623563609zA#;เช่า', 'success', '2025-10-15 18:27:43');
INSERT INTO `resell_users` (`user_id`, `username`, `password`, `email`, `role`, `balance`, `created_at`) VALUES
(15, 'REALMASA', '$2b$10$NS5tzADQ9UpwZbGmMG/5g.MWOKt.WtH7HZj/9zQllKMnQGIyMNE2O', 'Teerachat200xx05@gmail.com', 'user', '100.00', '2025-10-04 13:23:25'),
(16, 'test_user_for_dev', '$2a$10$KVVdMB8L0uPw5wdeir8QqO3UHhE0mpnunaegsBoX2K8cZOR/RO.AO', 'test@gmail.com', 'admin', '44641.00', '2025-10-04 14:05:25'),
(17, 'beam123', '$2a$10$.ImxH.GwFaBNeVBv8NgQQ.clteDQzm24NwFRdEfAoDBmg9OR9ogcS', NULL, 'user', '0.00', '2025-10-04 14:16:38'),
(18, 'aerbgea', '$2a$10$eRnLdCMpthdv4G9xkgdFjuydBhYNbgRmec3jLTpc0m/D8H2xHUOHG', 'aerbgea@gfdsg.com', 'user', '0.00', '2025-10-07 10:18:16'),
(19, 'beam123x', '$2a$10$ZjCK492KnpB03.27K3SpwedHPPDuFNsWpZoV7ujoNwpThuAklwyry', 'beamkinger@gmail.com', 'user', '0.00', '2025-10-11 12:47:59'),
(20, 'beam123xz', '$2a$10$URdbvxViajtn0WqkTAMPh.1Kiv17pCo.aMHPZ2Na5mNxz8m/XgVF6', 'beamkingxer@gmail.com', 'admin', '9682.00', '2025-10-11 12:48:18');
INSERT INTO `reviews` (`id`, `customer_id`, `user_id`, `review_text`, `rating`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '8', 60, 'ร้านนี้ดีมากครับ สินค้าคุณภาพดี บริการรวดเร็ว แนะนำเลย!', 5, 1, '2025-10-13 15:30:00', '2025-10-13 15:30:00'),
(2, '9', 61, 'บริการดีมากครับ ได้รับสินค้าตรงเวลา ราคาเหมาะสม', 4, 1, '2025-10-13 16:00:00', '2025-10-13 16:00:00'),
(3, '8', 60, 'สินค้าดีมาก แต่การจัดส่งช้าหน่อย แต่โดยรวมโอเค', 3, 1, '2025-10-13 16:30:00', '2025-10-13 16:30:00'),
(4, '9', 59, 'adadsadadadad', 5, 1, '2025-10-13 21:01:24', '2025-10-13 21:01:24'),
(5, '11', 64, 'ร้านดีมากรหัส ROV สุดจัด', 5, 1, '2025-10-15 18:36:34', '2025-10-15 18:36:34'),
(6, '8', 66, 'ดีจริงจากคนชอบหมา', 5, 1, '2025-10-23 20:19:35', '2025-10-23 20:19:35');
INSERT INTO `roles` (`id`, `customer_id`, `rank_name`, `can_edit_categories`, `can_edit_products`, `can_edit_users`, `can_edit_orders`, `can_manage_keys`, `can_view_reports`, `can_manage_promotions`, `can_manage_settings`, `can_access_reseller_price`, `created_at`) VALUES
(49, '8', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 0, '2025-10-08 12:06:11'),
(53, '9', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 0, '2025-10-10 14:47:07'),
(54, '10', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 0, '2025-10-14 15:23:03'),
(55, '11', 'admin', 1, 1, 1, 1, 1, 1, 1, 1, 0, '2025-10-15 18:27:44');
INSERT INTO `theme_settings` (`id`, `customer_id`, `primary_color`, `secondary_color`, `background_color`, `text_color`, `updated_at`, `theme_mode`) VALUES
(47, '8', '#2994ff', '#c7c7c7', '#000000', '#ffffff', '2025-10-14 15:58:17', 'dark'),
(51, '9', '#2994ff', '#29f8ff', '#FFFFFF', '#000000', '2025-10-10 14:47:07', 'dark'),
(52, '10', '#2994ff', '#d6d6d6', '#000000', '#ffffff', '2025-10-14 15:53:53', 'dark'),
(53, '11', '#ff0000', '#ffffff', '#000000', '#ffffff', '2025-10-20 18:17:24', 'dark');
INSERT INTO `topups` (`id`, `customer_id`, `user_id`, `amount`, `method`, `transaction_ref`, `status`, `created_at`, `updated_at`) VALUES
(5, '9', 59, '30.00', 'bank_transfer', '015285181649CTF00429', 'success', '2025-10-23 18:08:32', '2025-10-23 18:08:32');
INSERT INTO `transaction_items` (`id`, `customer_id`, `bill_number`, `transaction_id`, `product_id`, `quantity`, `price`, `created_at`, `license_id`) VALUES
(18, '8', 'BILL-1760368286484-MIDL1VHRR', 18, 79, 1, '10.00', '2025-10-13 15:11:27', 1038),
(19, '8', 'BILL-1760457629193-WMZHJ8KX3', 19, 79, 1, '10.00', '2025-10-14 16:00:29', 1039);
INSERT INTO `transactions` (`id`, `customer_id`, `bill_number`, `user_id`, `total_price`, `created_at`, `updated_at`) VALUES
(18, '8', 'BILL-1760368286484-MIDL1VHRR', 60, '10.00', '2025-10-13 15:11:26', '2025-10-13 15:11:26'),
(19, '8', 'BILL-1760457629193-WMZHJ8KX3', 62, '10.00', '2025-10-14 16:00:29', '2025-10-14 16:00:29');
INSERT INTO `users` (`id`, `customer_id`, `discord_id`, `fullname`, `email`, `password`, `money`, `points`, `role`, `created_at`) VALUES
(52, '8', NULL, 'modelv Admin', 'modelv446681@gmail.com', '$2a$10$IcdbBBBLvBwuHSva2P7JSOTImxjuJmZaAsee1Mm55hN6yLaQMJheK', '0.00', 0, 'admin', '2025-10-08 12:06:12'),
(58, '9', NULL, 'death Admin', 'death299265@gmail.com', '$2a$10$ABfWQYsWVnM0/izAcWkmoep3ji9E3Jf0rTKongdBBP75IQ45yqpki', '0.00', 0, 'admin', '2025-10-10 14:47:08'),
(59, '9', NULL, 'Death', 'Teerachat20005xxx@gmail.com', '$2b$10$AxmL7N0QuduyypQstWYKZu8dAFftYyBoDuttOGy8oWpB9Ie.oDXD.', '60.00', 0, 'admin', '2025-10-13 12:25:55'),
(60, '8', '257164973552304130', 'kiddyxstore4', 'beamkinger@gmail.com', '$2b$10$vzZ6MU8kPdNKWqLfAivNDOByYT8QbESO0EIGOCtH5E1bo/FqO3dZK', '99989.00', 0, 'admin', '2025-10-13 14:54:55'),
(61, '9', NULL, 'admin', 'admin@gmail.com', '$2b$10$lahNgQ6Foeig2zHApbrsBePeHeWbrhionfquMY1nsUc415WOXxWm2', '0.00', 0, 'admin', '2025-10-13 14:55:34'),
(62, '8', NULL, 'admin', 'admin@gmail.com', '$2b$10$0wMuzF.4hNEkFg3EFTdRr.0LQjVrJb/84avqMwChnL5IaoIhR/G/q', '990.00', 1000, 'admin', '2025-10-14 10:20:52'),
(63, '10', NULL, 'reaplnwstorex2 Admin', 'reaplnwstorex2728342@gmail.com', '$2a$10$rKsA4Tz51xXn1DuMv20VWep29rogF1zyRjkvMQJ4gdDbnsMDXibXK', '1000.00', 1000, 'admin', '2025-10-14 15:23:05'),
(64, '11', NULL, 'kiddyxstore Admin', 'kiddyxstore628379@gmail.com', '$2a$10$UZf7zNMP59fnikYT4XNOjelQxbrfmSzw.X5XM.l.Dl3p.TnIw0/uq', '0.00', 0, 'admin', '2025-10-15 18:27:45'),
(65, '11', NULL, 'Teelek', 'sathiyapuy10@gmail.com', '$2b$10$1tR1LZKpzuSRJf3.59cFduLkv/IZtaiyvhHx75sRqsK/L25gOdNjm', '0.00', 0, 'member', '2025-10-20 18:16:04'),
(66, '8', NULL, 'beam101z', '123@123.comx', '$2b$10$ZsHzbPVAzREh8MDMA4zkn.o5wLhuEWQYEau1fYRZvWCPoZ5shZgwe', '0.00', 0, 'member', '2025-10-23 20:12:45');


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `products` (`id` `category_id`, `title`, `subtitle`, `price`, `reseller_price`, `stock`, `duration`, `image`, `download_link`, `isSpecial`, `featured`, `isActive`, `isWarrenty`, `warrenty_text`, `primary_color`, `secondary_color`, `created_at`, `priority`, `discount_percent`) VALUES
(1, 1, 'Sample Product', '- สินค้าทั่วไป', '10.00', '5.00', 0, '', 'https://img5.pic.in.th/file/secure-sv1/f-id-o-3.jpg', '', 0, 1, 1, 1, 'รับประกันถาวร', '#37ff00', '',  0, 0);
