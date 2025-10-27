import express from "express";
import pool from "../config/database.js";
import verifyToken from "../middleware/auth.middleware.js";

const router = express.Router();

// ฟังก์ชันสร้าง bill number
function generateBillNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL${timestamp}${random}`;
}

// POST /purchase - ซื้อสินค้า (ต้อง login)
router.post("/", verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { product_id, quantity = 1 } = req.body;
        const user_id = req.user.id;
        
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!product_id) {
            await connection.rollback();
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุสินค้าที่ต้องการซื้อ"
            });
        }
        
        if (quantity < 1) {
            await connection.rollback();
            return res.status(400).json({
                status: "error",
                message: "จำนวนสินค้าต้องมากกว่า 0"
            });
        }
        
        // ดึงข้อมูล product
        const [products] = await connection.query(
            "SELECT * FROM products WHERE id = ? AND isActive = 1",
            [product_id]
        );
        
        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                status: "error",
                message: "ไม่พบสินค้านี้"
            });
        }
        
        const product = products[0];
        
        // ดึงข้อมูล user
        const [users] = await connection.query(
            "SELECT * FROM users WHERE id = ?",
            [user_id]
        );
        
        const user = users[0];
        
        // ตรวจสอบราคา (ถ้าเป็น reseller ใช้ reseller_price)
        let price = product.price;
        if (user.role === 'reseller' && product.reseller_price) {
            price = product.reseller_price;
        }
        
        const totalPrice = parseFloat(price) * quantity;
        
        // ตรวจสอบเงินในบัญชี
        if (parseFloat(user.money) < totalPrice) {
            await connection.rollback();
            return res.status(400).json({
                status: "error",
                message: "เงินในบัญชีไม่เพียงพอ",
                required: totalPrice,
                available: parseFloat(user.money)
            });
        }
        
        // ตรวจสอบ stock ที่เหลือ
        const [availableStock] = await connection.query(
            "SELECT id, license_key FROM product_stock WHERE product_id = ? AND sold = 0 LIMIT ?",
            [product_id, quantity]
        );
        
        if (availableStock.length < quantity) {
            await connection.rollback();
            return res.status(400).json({
                status: "error",
                message: "สินค้ามีจำนวนไม่เพียงพอ",
                available: availableStock.length,
                requested: quantity
            });
        }
        
        // สร้าง bill number
        const billNumber = generateBillNumber();
        
        // สร้าง transaction
        const [transactionResult] = await connection.query(
            "INSERT INTO transactions (bill_number, user_id, total_price) VALUES (?, ?, ?)",
            [billNumber, user_id, totalPrice]
        );
        
        const transactionId = transactionResult.insertId;
        
        // สร้าง transaction_items และอัปเดต stock
        const purchasedItems = [];
        
        for (let i = 0; i < quantity; i++) {
            const stock = availableStock[i];
            
            // บันทึก transaction_item
            await connection.query(
                `INSERT INTO transaction_items 
                (bill_number, transaction_id, product_id, quantity, price, license_id) 
                VALUES (?, ?, ?, 1, ?, ?)`,
                [billNumber, transactionId, product_id, price, stock.id]
            );
            
            // อัปเดต product_stock เป็น sold
            await connection.query(
                "UPDATE product_stock SET sold = 1 WHERE id = ?",
                [stock.id]
            );
            
            purchasedItems.push({
                license_key: stock.license_key,
                product_id: product_id,
                product_title: product.title
            });
        }
        
        // หักเงินจากบัญชี user
        await connection.query(
            "UPDATE users SET money = money - ? WHERE id = ?",
            [totalPrice, user_id]
        );
        
        // Commit transaction
        await connection.commit();
        
        res.json({
            status: "success",
            message: "ซื้อสินค้าสำเร็จ",
            data: {
                bill_number: billNumber,
                transaction_id: transactionId,
                total_price: totalPrice,
                quantity: quantity,
                remaining_balance: parseFloat(user.money) - totalPrice,
                items: purchasedItems,
                product: {
                    id: product.id,
                    title: product.title,
                    image: product.image,
                    download_link: product.download_link
                }
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error("Purchase error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถซื้อสินค้าได้",
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// GET /purchase/history - ดูประวัติการซื้อของตัวเอง (ต้อง login)
router.get("/history", verifyToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { limit = 20, offset = 0 } = req.query;
        
        // ดึงประวัติการซื้อ
        const [transactions] = await pool.query(
            `SELECT t.*, COUNT(ti.id) as item_count
             FROM transactions t
             LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
             WHERE t.user_id = ?
             GROUP BY t.id
             ORDER BY t.created_at DESC
             LIMIT ? OFFSET ?`,
            [user_id, parseInt(limit), parseInt(offset)]
        );
        
        // ดึงรายละเอียด items ของแต่ละ transaction
        for (let transaction of transactions) {
            const [items] = await pool.query(
                `SELECT ti.*, p.title as product_title, p.image as product_image,
                        ps.license_key
                 FROM transaction_items ti
                 LEFT JOIN products p ON ti.product_id = p.id
                 LEFT JOIN product_stock ps ON ti.license_id = ps.id
                 WHERE ti.transaction_id = ?`,
                [transaction.id]
            );
            transaction.items = items;
        }
        
        // นับจำนวนทั้งหมด
        const [countResult] = await pool.query(
            "SELECT COUNT(*) as total FROM transactions WHERE user_id = ?",
            [user_id]
        );
        
        res.json({
            status: "success",
            data: transactions,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching purchase history:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงประวัติการซื้อได้",
            error: error.message
        });
    }
});

// GET /purchase/:bill_number - ดูรายละเอียดการซื้อจาก bill number (ต้อง login)
router.get("/:bill_number", verifyToken, async (req, res) => {
    try {
        const { bill_number } = req.params;
        const user_id = req.user.id;
        
        // ดึงข้อมูล transaction
        const [transactions] = await pool.query(
            "SELECT * FROM transactions WHERE bill_number = ? AND user_id = ?",
            [bill_number, user_id]
        );
        
        if (transactions.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบรายการซื้อนี้"
            });
        }
        
        const transaction = transactions[0];
        
        // ดึงรายละเอียด items
        const [items] = await pool.query(
            `SELECT ti.*, p.title as product_title, p.subtitle as product_subtitle,
                    p.image as product_image, p.download_link,
                    ps.license_key
             FROM transaction_items ti
             LEFT JOIN products p ON ti.product_id = p.id
             LEFT JOIN product_stock ps ON ti.license_id = ps.id
             WHERE ti.transaction_id = ?`,
            [transaction.id]
        );
        
        transaction.items = items;
        
        res.json({
            status: "success",
            data: transaction
        });
    } catch (error) {
        console.error("Error fetching purchase detail:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลการซื้อได้",
            error: error.message
        });
    }
});

export default router;

