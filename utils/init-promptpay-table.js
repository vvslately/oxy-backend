import pool from '../config/database.js';

/**
 * สร้างตาราง promptpay_qr_code อัตโนมัติ (ถ้ายังไม่มี)
 */
export async function initializePromptPayTable() {
  try {
    // ตรวจสอบว่าตารางมีอยู่หรือไม่
    const [tables] = await pool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promptpay_qr_code'"
    );

    if (tables.length === 0) {
      console.log('📦 Creating promptpay_qr_code table...');
      
      // สร้างตาราง
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS \`promptpay_qr_code\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`user_id\` int NOT NULL,
          \`phone_number\` varchar(50) NOT NULL,
          \`amount\` decimal(10,2) NOT NULL,
          \`qr_payload\` text NOT NULL,
          \`qr_image\` longtext NOT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_user_id\` (\`user_id\`),
          KEY \`idx_amount\` (\`amount\`),
          KEY \`idx_created_at\` (\`created_at\`),
          CONSTRAINT \`promptpay_qr_code_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      console.log('✅ promptpay_qr_code table created successfully!');
    } else {
      console.log('✅ promptpay_qr_code table already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing promptpay_qr_code table:', error.message);
    // ไม่ throw error เพื่อไม่ให้ server หยุดทำงาน
    // ถ้าตารางไม่มีจริงๆ จะเกิด error เมื่อใช้งาน API และผู้ใช้สามารถรัน SQL ได้เอง
  }
}

export default initializePromptPayTable;

