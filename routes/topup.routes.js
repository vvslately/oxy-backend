import express from 'express';
import axios from 'axios';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// API สำหรับเติมเงินผ่านอั่งเปา TrueMoney
router.post('/redeem-angpao', verifyToken, async (req, res) => {
  try {
    const { link } = req.body;

    // ตรวจสอบว่ามีลิงก์หรือไม่
    if (!link) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาระบุลิงก์อั่งเปา' 
      });
    }

    // ดึงเบอร์โทรจากตาราง config
    const [configRows] = await pool.execute(
      'SELECT owner_phone FROM config ORDER BY id ASC LIMIT 1'
    );
    
    if (!configRows.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่พบเบอร์โทรในระบบ - กรุณาติดต่อผู้ดูแลระบบ' 
      });
    }

    const phone = configRows[0].owner_phone;

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const [user] = await pool.execute(
      'SELECT id, money FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบข้อมูลผู้ใช้' 
      });
    }

    // ดึง campaign ID จาก link
    let campaignId = link;

    if (link.includes('gift.truemoney.com/campaign/?v=')) {
      const urlParams = new URL(link).searchParams;
      campaignId = urlParams.get('v');
    } else if (link.includes('v=')) {
      const match = link.match(/[?&]v=([^&]+)/);
      if (match) {
        campaignId = match[1];
      }
    }

    if (!campaignId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่พบ campaign ID ในลิงก์ - ตรวจสอบว่าลิงก์ถูกต้อง' 
      });
    }

    // เรียก API TrueMoney พร้อม retry
    let data;
    let lastError;
    const maxRetries = 3;
    
    console.log(`[Topup] User ${req.user.id} attempting to redeem angpao: ${campaignId}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Topup] Calling TrueMoney API (attempt ${attempt}/${maxRetries}): https://api.xpluem.com/${campaignId}/${phone}`);
        
        const response = await axios.get(`https://api.xpluem.com/${campaignId}/${phone}`, {
          timeout: 15000, // timeout 15 วินาที
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          validateStatus: function (status) {
            return status < 500; // รับ status code น้อยกว่า 500
          }
        });
        
        data = response.data;
        console.log(`[Topup] TrueMoney API Response (attempt ${attempt}):`, data);
        
        // ถ้าได้ response แล้วให้ break ออกจาก loop
        break;
        
      } catch (error) {
        lastError = error;
        console.error(`[Topup] TrueMoney API attempt ${attempt} failed:`, error.message);
        
        // ถ้าเป็น attempt สุดท้ายให้ throw error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // รอ 2 วินาทีก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // เริ่ม transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // ตรวจสอบ response data
      if (!data) {
        throw new Error('ไม่ได้รับข้อมูลจาก API TrueMoney');
      }

      const amount = data.data ? parseFloat(data.data.amount) : 0;
      const status = data.success ? 'success' : 'failed';
      
      // ตรวจสอบจำนวนเงิน
      if (amount <= 0) {
        throw new Error('จำนวนเงินไม่ถูกต้องหรือลิงก์หมดอายุแล้ว');
      }

      // ตรวจสอบว่ามีการเติมเงินซ้ำหรือไม่ (ตรวจสอบ campaign ID ใน 24 ชั่วโมงที่ผ่านมา)
      const [existingTopup] = await connection.execute(
        'SELECT id FROM topups WHERE user_id = ? AND transaction_ref = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [req.user.id, `Campaign: ${campaignId}`]
      );

      if (existingTopup.length > 0) {
        throw new Error('ลิงก์นี้ถูกใช้แล้วใน 24 ชั่วโมงที่ผ่านมา');
      }

      // บันทึกลงตาราง topups
      const [topupResult] = await connection.execute(
        'INSERT INTO topups (user_id, amount, method, transaction_ref, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, amount, 'angpao', `Campaign: ${campaignId}`, status]
      );

      // ถ้าสำเร็จ ให้บวกเงิน
      if (data.success && (data.message === 'รับเงินสำเร็จ' || data.message === 'success')) {
        const newMoney = parseFloat(user[0].money) + amount;
        
        // อัปเดตเงินผู้ใช้
        const [updateResult] = await connection.execute(
          'UPDATE users SET money = ? WHERE id = ?',
          [newMoney, req.user.id]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error('ไม่สามารถอัปเดตยอดเงินได้ - กรุณาติดต่อผู้ดูแลระบบ');
        }

        // อัปเดตสถานะ topup เป็น success
        await connection.execute(
          'UPDATE topups SET status = ? WHERE id = ?',
          ['success', topupResult.insertId]
        );

        await connection.commit();

        console.log(`[Topup] Success: User ${req.user.id}, Amount: ${amount}, New Balance: ${newMoney}, Campaign: ${campaignId}`);

        res.json({
          success: true,
          message: `เติมเงินสำเร็จ: +${amount} บาท`,
          data: {
            amount: amount,
            new_balance: newMoney,
            topup_id: topupResult.insertId,
            campaign_id: campaignId
          }
        });
      } else {
        // อัปเดตสถานะ topup เป็น failed
        await connection.execute(
          'UPDATE topups SET status = ? WHERE id = ?',
          ['failed', topupResult.insertId]
        );

        await connection.commit();

        console.log(`[Topup] Failed: User ${req.user.id}, Campaign: ${campaignId}, Message: ${data.message}`);

        res.json({
          success: false,
          message: data.message || 'การเติมเงินไม่สำเร็จ - ลิงก์อาจถูกใช้แล้วหรือหมดอายุ',
          data: {
            amount: amount,
            topup_id: topupResult.insertId,
            campaign_id: campaignId
          }
        });
      }

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error('[Topup] Error:', err);

    // กรณีเรียก API ล้มเหลว
    if (err.response) {
      console.error('[Topup] API Error Details:', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
        url: err.config?.url,
        user_id: req.user?.id
      });

      let errorMessage = 'ไม่สามารถเชื่อมต่อ API TrueMoney ได้';

      if (err.response.status === 500) {
        errorMessage = 'API เกิดข้อผิดพลาดภายใน - อาจเป็นเพราะ campaign ID ไม่ถูกต้องหรือ API มีปัญหา';
      } else if (err.response.status === 404) {
        errorMessage = 'ไม่พบ campaign ID ที่ระบุ - ลิงก์อาจหมดอายุหรือไม่ถูกต้อง';
      } else if (err.response.status === 400) {
        errorMessage = 'ข้อมูลที่ส่งไปไม่ถูกต้อง - ตรวจสอบลิงก์และเบอร์โทร';
      } else if (err.response.status === 403) {
        errorMessage = 'ไม่มีสิทธิ์เข้าถึง API - ลิงก์อาจถูกใช้แล้ว';
      } else if (err.response.status === 429) {
        errorMessage = 'เรียก API เกินขีดจำกัด - กรุณารอสักครู่แล้วลองใหม่';
      }

      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: {
          status: err.response.status,
          message: err.response.data?.message || err.response.statusText
        }
      });
    }

    // กรณี timeout หรือ network error
    if (err.code === 'ECONNABORTED') {
      return res.status(500).json({
        success: false,
        error: 'การเชื่อมต่อ API หมดเวลา - กรุณาลองใหม่อีกครั้ง',
        details: {
          code: err.code
        }
      });
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(500).json({
        success: false,
        error: 'ไม่สามารถเชื่อมต่อ API ได้ - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        details: {
          code: err.code
        }
      });
    }

    // กรณี error อื่นๆ
    res.status(500).json({
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในระบบ',
      details: {
        message: err.message
      }
    });
  }
});

// API สำหรับดูประวัติการเติมเงิน
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const [topups] = await pool.execute(
      `SELECT 
        id,
        amount,
        method,
        transaction_ref,
        status,
        created_at
      FROM topups 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const [totalCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM topups WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        topups: topups,
        total: totalCount[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (err) {
    console.error('[Topup] History error:', err);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงประวัติการเติมเงินได้',
      details: {
        message: err.message
      }
    });
  }
});

export default router;

