import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { redeemAngpao } from '../utils/tw-angpao-helper.js';

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

    // ดึง voucher code จาก link
    // TrueWallet links can be in format: https://gift.truemoney.com/campaign/?v=<voucher_code>
    // Or the voucher code might be directly in the link
    let voucherCode = link;

    // Extract voucher code from TrueWallet URL
    if (link.includes('gift.truemoney.com/campaign/?v=')) {
      try {
        const urlParams = new URL(link).searchParams;
        voucherCode = urlParams.get('v');
      } catch (e) {
        // If URL parsing fails, try regex
        const match = link.match(/[?&]v=([^&]+)/);
        if (match) {
          voucherCode = match[1];
        }
      }
    } else if (link.includes('v=')) {
      const match = link.match(/[?&]v=([^&]+)/);
      if (match) {
        voucherCode = match[1];
      }
    } else if (link.includes('gift.truemoney.com/campaign/vouchers/')) {
      // Format: https://gift.truemoney.com/campaign/vouchers/<voucher_code>
      const match = link.match(/vouchers\/([^/?]+)/);
      if (match) {
        voucherCode = match[1];
      }
    }

    if (!voucherCode || voucherCode === link) {
      // If we couldn't extract, use the link as-is (might be the voucher code directly)
      voucherCode = link.trim();
    }

    console.log(`[Topup] User ${req.user.id} attempting to redeem angpao: ${voucherCode}`);

    // เรียก API TrueMoney ผ่าน tw-angpao package
    let response;
    try {
      response = await redeemAngpao(phone, voucherCode);
      console.log(`[Topup] TrueMoney API Response:`, response);
    } catch (error) {
      console.error('[Topup] TrueMoney API Error:', error);
      throw new Error(`ไม่สามารถเชื่อมต่อ API TrueMoney ได้: ${error.message}`);
    }

    // เริ่ม transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // ตรวจสอบ response
      if (!response || !response.status) {
        throw new Error('ไม่ได้รับข้อมูลจาก API TrueMoney');
      }

      // ตรวจสอบว่าสำเร็จหรือไม่
      const isSuccess = response.status.code === 'SUCCESS';
      
      // ดึงจำนวนเงินจาก response
      let amount = 0;
      if (isSuccess && response.data && response.data.voucher) {
        amount = parseFloat(response.data.voucher.redeemed_amount_baht || response.data.voucher.amount_baht || 0);
      }

      // ตรวจสอบว่ามีการเติมเงินซ้ำหรือไม่ (ตรวจสอบ voucher code ใน 24 ชั่วโมงที่ผ่านมา)
      const [existingTopup] = await connection.execute(
        'SELECT id FROM topups WHERE user_id = ? AND transaction_ref = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [req.user.id, `Voucher: ${voucherCode}`]
      );

      if (existingTopup.length > 0) {
        throw new Error('ลิงก์นี้ถูกใช้แล้วใน 24 ชั่วโมงที่ผ่านมา');
      }

      const status = isSuccess ? 'success' : 'failed';

      // บันทึกลงตาราง topups
      const [topupResult] = await connection.execute(
        'INSERT INTO topups (user_id, amount, method, transaction_ref, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, amount, 'angpao', `Voucher: ${voucherCode}`, status]
      );

      // ถ้าสำเร็จ ให้บวกเงิน
      if (isSuccess && amount > 0) {
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

        console.log(`[Topup] Success: User ${req.user.id}, Amount: ${amount}, New Balance: ${newMoney}, Voucher: ${voucherCode}`);

        res.json({
          success: true,
          message: `เติมเงินสำเร็จ: +${amount} บาท`,
          data: {
            amount: amount,
            new_balance: newMoney,
            topup_id: topupResult.insertId,
            voucher_code: voucherCode,
            voucher_data: response.data
          }
        });
      } else {
        // อัปเดตสถานะ topup เป็น failed
        await connection.execute(
          'UPDATE topups SET status = ? WHERE id = ?',
          ['failed', topupResult.insertId]
        );

        await connection.commit();

        // แปลง error code เป็นข้อความภาษาไทย
        let errorMessage = response.status.message || 'การเติมเงินไม่สำเร็จ';
        
        const errorMessages = {
          'VOUCHER_OUT_OF_STOCK': 'วอยเชอร์หมดสต็อก',
          'VOUCHER_NOT_FOUND': 'ไม่พบวอยเชอร์ - ลิงก์อาจไม่ถูกต้อง',
          'CANNOT_GET_OWN_VOUCHER': 'ไม่สามารถรับวอยเชอร์ของตนเองได้',
          'VOUCHER_EXPIRED': 'วอยเชอร์หมดอายุแล้ว',
          'INVALID_PHONE_NUMBER': 'เบอร์โทรไม่ถูกต้อง',
          'INVALID_VOUCHER_CODE': 'รหัสวอยเชอร์ไม่ถูกต้อง',
          'NETWORK_ERROR': 'เกิดข้อผิดพลาดในการเชื่อมต่อ - กรุณาลองใหม่อีกครั้ง'
        };

        if (errorMessages[response.status.code]) {
          errorMessage = errorMessages[response.status.code];
        }

        console.log(`[Topup] Failed: User ${req.user.id}, Voucher: ${voucherCode}, Code: ${response.status.code}, Message: ${errorMessage}`);

        res.json({
          success: false,
          message: errorMessage,
          data: {
            amount: amount,
            topup_id: topupResult.insertId,
            voucher_code: voucherCode,
            error_code: response.status.code
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

