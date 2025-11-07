import express from 'express';
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper function to generate PromptPay QR Code
async function generatePromptPayQR(promptpayNumber, amount) {
  try {
    // Generate PromptPay payload using promptpay-qr library
    const payload = generatePayload(promptpayNumber, { amount: amount });
    
    // Generate QR Code as base64 image
    const qrCodeDataURL = await QRCode.toDataURL(payload);
    
    return {
      payload: payload,
      qrCodeImage: qrCodeDataURL
    };
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    throw new Error('ไม่สามารถสร้าง QR Code ได้');
  }
}

// สร้าง PromptPay QR Code
router.post('/promptpay-qr', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // ดึงข้อมูล PromptPay จาก config (ใช้ config แรก)
    const [configs] = await pool.execute(
      'SELECT promptpay_number, promptpay_name FROM config ORDER BY id ASC LIMIT 1'
    );

    if (configs.length === 0 || !configs[0].promptpay_number) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบการตั้งค่า PromptPay หรือหมายเลข PromptPay ยังไม่ได้ตั้งค่า'
      });
    }

    const config = configs[0];
    const promptpayNumber = config.promptpay_number;

    // ตรวจสอบจำนวนเงิน
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุจำนวนเงินที่ถูกต้อง (ต้องเป็นตัวเลขที่มากกว่า 0)'
      });
    }

    const qrAmount = amount;

    // ลบ QR Code เก่าของผู้ใช้ก่อนสร้างใหม่ (ถ้ามี QR Code ที่ยังไม่ได้ใช้)
    await pool.execute(
      'DELETE FROM promptpay_qr_code WHERE user_id = ?',
      [userId]
    );

    // สร้าง PromptPay QR Code
    const qrData = await generatePromptPayQR(promptpayNumber, qrAmount);

    // บันทึกลงฐานข้อมูล
    const [result] = await pool.execute(
      'INSERT INTO promptpay_qr_code (user_id, phone_number, amount, qr_payload, qr_image) VALUES (?, ?, ?, ?, ?)',
      [userId, promptpayNumber, qrAmount, qrData.payload, qrData.qrCodeImage]
    );

    const qrCodeData = {
      id: result.insertId,
      user_id: userId,
      phone_number: promptpayNumber,
      promptpay_name: config.promptpay_name,
      amount: qrAmount,
      qr_payload: qrData.payload,
      qr_image: qrData.qrCodeImage,
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'สร้าง PromptPay QR Code สำเร็จ',
      data: qrCodeData
    });

  } catch (err) {
    console.error('PromptPay QR creation error:', err);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้าง QR Code',
      details: err.message
    });
  }
});

// ดึงค่า amount ทั้งหมดจากตาราง promptpay_qr_code
router.get('/promptpay-amounts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT amount FROM promptpay_qr_code WHERE user_id = ?',
      [userId]
    );

    const amounts = rows.map(row => parseFloat(row.amount));

    res.status(200).json({
      success: true,
      message: 'ดึงค่า amount ทั้งหมดสำเร็จ',
      data: amounts
    });

  } catch (err) {
    console.error('Get amounts error:', err);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล amount'
    });
  }
});

// ดึงรายการ PromptPay QR Code ของผู้ใช้
router.get('/promptpay-qr', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // ดึงข้อมูล QR Code ของผู้ใช้
    const [qrCodes] = await pool.execute(
      `SELECT id, user_id, phone_number, amount, qr_payload, qr_image, created_at 
       FROM promptpay_qr_code 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // นับจำนวนทั้งหมด
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM promptpay_qr_code WHERE user_id = ?',
      [userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'ดึงข้อมูล PromptPay QR Code สำเร็จ',
      data: qrCodes,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (err) {
    console.error('PromptPay QR fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล QR Code'
    });
  }
});

// ดึง PromptPay QR Code ตาม ID
router.get('/promptpay-qr/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [qrCodes] = await pool.execute(
      'SELECT id, user_id, phone_number, amount, qr_payload, qr_image, created_at FROM promptpay_qr_code WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (qrCodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบ QR Code ที่ระบุ'
      });
    }

    res.json({
      success: true,
      message: 'ดึงข้อมูล PromptPay QR Code สำเร็จ',
      data: qrCodes[0]
    });

  } catch (err) {
    console.error('PromptPay QR fetch by ID error:', err);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล QR Code'
    });
  }
});

// ลบ PromptPay QR Code
router.delete('/promptpay-qr/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ตรวจสอบว่า QR Code เป็นของผู้ใช้หรือไม่
    const [existingQr] = await pool.execute(
      'SELECT id FROM promptpay_qr_code WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingQr.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบ QR Code ที่ระบุ'
      });
    }

    // ลบ QR Code
    await pool.execute(
      'DELETE FROM promptpay_qr_code WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'ลบ PromptPay QR Code สำเร็จ'
    });

  } catch (err) {
    console.error('PromptPay QR deletion error:', err);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบ QR Code'
    });
  }
});

// Webhook สำหรับรับข้อมูลการเติมเงินจากระบบภายนอก
router.post('/webhook/promptpay-payment', async (req, res) => {
  try {
    // Debug: ดูข้อมูลที่เข้ามา
    console.log('Webhook received:', {
      body: req.body,
      bodyType: typeof req.body,
      headers: req.headers,
      method: req.method
    });

    // ตรวจสอบว่า req.body มีข้อมูลหรือไม่
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'ไม่พบข้อมูลใน request body'
      });
    }

    const { amount } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุจำนวนเงิน'
      });
    }

    // แปลง amount เป็นตัวเลข
    const numericAmount = parseFloat(amount);

    // ตรวจสอบรูปแบบจำนวนเงิน
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0'
      });
    }

    // ค้นหา QR Code ที่มี amount ตรงกัน (เรียงตาม created_at ASC เพื่อใช้ตัวแรก)
    const [qrCodes] = await pool.execute(
      'SELECT id, user_id, amount, phone_number FROM promptpay_qr_code WHERE amount = ? ORDER BY created_at ASC',
      [numericAmount]
    );

    if (qrCodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบ QR Code ที่ตรงกับจำนวนเงินที่ระบุ',
        amount: numericAmount
      });
    }

    // ถ้ามีหลาย QR Code ที่ amount ตรงกัน ให้ใช้ตัวแรก
    const qrCode = qrCodes[0];
    const userId = qrCode.user_id;

    // เริ่ม transaction เพื่อให้การอัปเดตข้อมูลเป็นไปอย่างปลอดภัย
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    let topupResult;

    try {
      // อัปเดตยอดเงินของผู้ใช้ทันที (users.money)
      const [updateResult] = await connection.execute(
        'UPDATE users SET money = money + ? WHERE id = ?',
        [numericAmount, userId]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          error: 'ไม่พบผู้ใช้ที่ระบุ'
        });
      }

      // บันทึกลงตาราง topups
      [topupResult] = await connection.execute(
        'INSERT INTO topups (user_id, method, amount, transaction_ref, status) VALUES (?, ?, ?, ?, ?)',
        [userId, 'promptpay', numericAmount, `PromptPay_QR_${qrCode.id}`, 'success']
      );

      // ลบ QR Code ที่ใช้แล้ว
      await connection.execute(
        'DELETE FROM promptpay_qr_code WHERE id = ?',
        [qrCode.id]
      );

      await connection.commit();
      connection.release();

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

    // ดึงข้อมูลผู้ใช้หลังอัปเดต
    const [userResult] = await pool.execute(
      'SELECT id, fullname, email, money FROM users WHERE id = ?',
      [userId]
    );

    console.log(`Webhook processed successfully for user ${userId}, amount: ${numericAmount}`);

    res.status(200).json({
      success: true,
      message: 'Webhook ประมวลผลสำเร็จ',
      data: {
        user: userResult[0],
        amount_added: numericAmount,
        qr_code_id: qrCode.id,
        topup_id: topupResult.insertId,
        method: 'promptpay'
      }
    });

  } catch (err) {
    console.error('Webhook processing error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      headers: req.headers
    });

    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผล webhook',
      details: err.message
    });
  }
});

export default router;

