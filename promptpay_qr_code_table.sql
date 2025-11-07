-- สร้างตาราง promptpay_qr_code สำหรับเก็บ QR Code ของ PromptPay
-- รัน SQL นี้เพื่อสร้างตารางในฐานข้อมูล

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

