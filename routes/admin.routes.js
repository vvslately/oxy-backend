import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import verifyToken from "../middleware/auth.middleware.js";
import { requireAdmin, canEditUsers, canManageKeys } from "../middleware/permission.middleware.js";

const router = express.Router();

// GET /admin/stat - ดึงสถิติ dashboard (ต้องเป็น admin)
router.get("/stat", verifyToken, requireAdmin, async (req, res) => {
    try {
        // 1. จำนวนผู้ใช้ทั้งหมด
        const [userCount] = await pool.query(
            "SELECT COUNT(*) as total FROM users"
        );

        // 2. จำนวนสินค้าทั้งหมด
        const [productCount] = await pool.query(
            "SELECT COUNT(*) as total FROM products WHERE isActive = 1"
        );

        // 3. จำนวนคำสั่งซื้อ
        const [orderCount] = await pool.query(
            "SELECT COUNT(*) as total FROM transactions"
        );

        // 4. ยอดขายรวม
        const [totalSales] = await pool.query(
            "SELECT COALESCE(SUM(total_price), 0) as total FROM transactions"
        );

        res.json({
            status: "success",
            data: {
                total_users: userCount[0].total,
                total_products: productCount[0].total,
                total_orders: orderCount[0].total,
                total_sales: parseFloat(totalSales[0].total)
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลสถิติได้",
            error: error.message
        });
    }
});

// GET /admin/config - ดึงข้อมูล config ทั้งหมด (ต้อง login)
router.get("/config", verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM config LIMIT 1"
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูล config"
            });
        }
        
        res.json({
            status: "success",
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching config:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล config ได้",
            error: error.message
        });
    }
});

// PUT /admin/config - แก้ไขข้อมูล config (ต้อง login)
router.put("/config", verifyToken, async (req, res) => {
    try {
        // ดึง config id ที่มีอยู่
        const [existingConfig] = await pool.query("SELECT id FROM config LIMIT 1");
        
        if (existingConfig.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูล config ในระบบ กรุณาติดต่อผู้ดูแลระบบ"
            });
        }
        
        const configId = existingConfig[0].id;
        
        // ดึงข้อมูลที่จะอัพเดต
        const {
            owner_phone,
            site_name,
            site_logo,
            meta_title,
            meta_description,
            meta_keywords,
            meta_author,
            discord_link,
            discord_webhook,
            banner_link,
            banner2_link,
            banner3_link,
            navigation_banner_1,
            navigation_link_1,
            navigation_banner_2,
            navigation_link_2,
            navigation_banner_3,
            navigation_link_3,
            navigation_banner_4,
            navigation_link_4,
            background_image,
            footer_image,
            load_logo,
            footer_logo,
            theme,
            font_select,
            ad_banner,
            bank_account_name,
            bank_account_number,
            bank_account_name_thai,
            promptpay_number,
            promptpay_name,
            line_cookie,
            line_mac,
            verify_token,
            auto_verify_enabled
        } = req.body;
        
        // สร้าง dynamic query สำหรับ update เฉพาะฟิลด์ที่ส่งมา
        const updates = [];
        const values = [];
        
        if (owner_phone !== undefined) {
            updates.push("owner_phone = ?");
            values.push(owner_phone);
        }
        if (site_name !== undefined) {
            updates.push("site_name = ?");
            values.push(site_name);
        }
        if (site_logo !== undefined) {
            updates.push("site_logo = ?");
            values.push(site_logo);
        }
        if (meta_title !== undefined) {
            updates.push("meta_title = ?");
            values.push(meta_title);
        }
        if (meta_description !== undefined) {
            updates.push("meta_description = ?");
            values.push(meta_description);
        }
        if (meta_keywords !== undefined) {
            updates.push("meta_keywords = ?");
            values.push(meta_keywords);
        }
        if (meta_author !== undefined) {
            updates.push("meta_author = ?");
            values.push(meta_author);
        }
        if (discord_link !== undefined) {
            updates.push("discord_link = ?");
            values.push(discord_link);
        }
        if (discord_webhook !== undefined) {
            updates.push("discord_webhook = ?");
            values.push(discord_webhook);
        }
        if (banner_link !== undefined) {
            updates.push("banner_link = ?");
            values.push(banner_link);
        }
        if (banner2_link !== undefined) {
            updates.push("banner2_link = ?");
            values.push(banner2_link);
        }
        if (banner3_link !== undefined) {
            updates.push("banner3_link = ?");
            values.push(banner3_link);
        }
        if (navigation_banner_1 !== undefined) {
            updates.push("navigation_banner_1 = ?");
            values.push(navigation_banner_1);
        }
        if (navigation_link_1 !== undefined) {
            updates.push("navigation_link_1 = ?");
            values.push(navigation_link_1);
        }
        if (navigation_banner_2 !== undefined) {
            updates.push("navigation_banner_2 = ?");
            values.push(navigation_banner_2);
        }
        if (navigation_link_2 !== undefined) {
            updates.push("navigation_link_2 = ?");
            values.push(navigation_link_2);
        }
        if (navigation_banner_3 !== undefined) {
            updates.push("navigation_banner_3 = ?");
            values.push(navigation_banner_3);
        }
        if (navigation_link_3 !== undefined) {
            updates.push("navigation_link_3 = ?");
            values.push(navigation_link_3);
        }
        if (navigation_banner_4 !== undefined) {
            updates.push("navigation_banner_4 = ?");
            values.push(navigation_banner_4);
        }
        if (navigation_link_4 !== undefined) {
            updates.push("navigation_link_4 = ?");
            values.push(navigation_link_4);
        }
        if (background_image !== undefined) {
            updates.push("background_image = ?");
            values.push(background_image);
        }
        if (footer_image !== undefined) {
            updates.push("footer_image = ?");
            values.push(footer_image);
        }
        if (load_logo !== undefined) {
            updates.push("load_logo = ?");
            values.push(load_logo);
        }
        if (footer_logo !== undefined) {
            updates.push("footer_logo = ?");
            values.push(footer_logo);
        }
        if (theme !== undefined) {
            updates.push("theme = ?");
            values.push(theme);
        }
        if (font_select !== undefined) {
            updates.push("font_select = ?");
            values.push(font_select);
        }
        if (ad_banner !== undefined) {
            updates.push("ad_banner = ?");
            values.push(ad_banner);
        }
        if (bank_account_name !== undefined) {
            updates.push("bank_account_name = ?");
            values.push(bank_account_name);
        }
        if (bank_account_number !== undefined) {
            updates.push("bank_account_number = ?");
            values.push(bank_account_number);
        }
        if (bank_account_name_thai !== undefined) {
            updates.push("bank_account_name_thai = ?");
            values.push(bank_account_name_thai);
        }
        if (promptpay_number !== undefined) {
            updates.push("promptpay_number = ?");
            values.push(promptpay_number);
        }
        if (promptpay_name !== undefined) {
            updates.push("promptpay_name = ?");
            values.push(promptpay_name);
        }
        if (line_cookie !== undefined) {
            updates.push("line_cookie = ?");
            values.push(line_cookie);
        }
        if (line_mac !== undefined) {
            updates.push("line_mac = ?");
            values.push(line_mac);
        }
        if (verify_token !== undefined) {
            updates.push("verify_token = ?");
            values.push(verify_token);
        }
        if (auto_verify_enabled !== undefined) {
            updates.push("auto_verify_enabled = ?");
            values.push(auto_verify_enabled);
        }
        
        // ตรวจสอบว่ามีฟิลด์ที่จะอัพเดตหรือไม่
        if (updates.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ไม่มีข้อมูลที่จะอัพเดต"
            });
        }
        
        // เพิ่ม updated_at
        updates.push("updated_at = NOW()");
        
        // เพิ่ม configId ในตอนท้าย
        values.push(configId);
        
        // สร้าง query
        const query = `UPDATE config SET ${updates.join(", ")} WHERE id = ?`;
        
        // Execute query
        await pool.query(query, values);
        
        // ดึงข้อมูลที่อัพเดตแล้ว
        const [updatedConfig] = await pool.query(
            "SELECT * FROM config WHERE id = ?",
            [configId]
        );
        
        res.json({
            status: "success",
            message: "อัพเดต config สำเร็จ",
            data: updatedConfig[0]
        });
        
    } catch (error) {
        console.error("Error updating config:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถอัพเดต config ได้",
            error: error.message
        });
    }
});

// ============== USER MANAGEMENT ==============

// GET /admin/users - ดึงรายการผู้ใช้ทั้งหมด (ต้องมีสิทธิ์)
router.get("/users", verifyToken, canEditUsers, async (req, res) => {
    try {
        const { 
            search, 
            role, 
            limit = 20, 
            offset = 0,
            sort = 'newest' // newest, oldest, name
        } = req.query;

        let query = "SELECT id, discord_id, fullname, email, money, points, role, created_at FROM users WHERE 1=1";
        const params = [];

        // Search by name or email
        if (search) {
            query += " AND (fullname LIKE ? OR email LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        // Filter by role
        if (role) {
            query += " AND role = ?";
            params.push(role);
        }

        // Sorting
        switch (sort) {
            case 'oldest':
                query += " ORDER BY created_at ASC";
                break;
            case 'name':
                query += " ORDER BY fullname ASC";
                break;
            case 'newest':
            default:
                query += " ORDER BY created_at DESC";
                break;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.query(query, params);

        // Count total users
        let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1";
        const countParams = [];

        if (search) {
            countQuery += " AND (fullname LIKE ? OR email LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            countQuery += " AND role = ?";
            countParams.push(role);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            status: "success",
            data: users,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
            error: error.message
        });
    }
});

// GET /admin/users/:id - ดึงข้อมูลผู้ใช้คนเดียว (ต้องมีสิทธิ์)
router.get("/users/:id", verifyToken, canEditUsers, async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query(
            "SELECT id, discord_id, fullname, email, money, points, role, created_at FROM users WHERE id = ?",
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบผู้ใช้นี้"
            });
        }

        const user = users[0];

        // ดึงสถิติการซื้อของผู้ใช้
        const [orderStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_price), 0) as total_spending
             FROM transactions 
             WHERE user_id = ?`,
            [id]
        );

        user.statistics = {
            total_orders: orderStats[0].total_orders,
            total_spending: parseFloat(orderStats[0].total_spending)
        };

        res.json({
            status: "success",
            data: user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้",
            error: error.message
        });
    }
});

// POST /admin/users - สร้างผู้ใช้ใหม่ (ต้องมีสิทธิ์)
router.post("/users", verifyToken, canEditUsers, async (req, res) => {
    try {
        const {
            fullname,
            email,
            password,
            discord_id,
            money = 0,
            points = 0,
            role = 'member'
        } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!fullname || !email || !password) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ fullname, email และ password"
            });
        }

        // ตรวจสอบว่า email ซ้ำหรือไม่
        const [existingUser] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Email นี้ถูกใช้งานแล้ว"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: "error",
                message: "รูปแบบ Email ไม่ถูกต้อง"
            });
        }

        // เข้ารหัส password
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้างผู้ใช้ใหม่
        const [result] = await pool.query(
            `INSERT INTO users (fullname, email, password, discord_id, money, points, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fullname, email, hashedPassword, discord_id || null, money, points, role]
        );

        // ดึงข้อมูลผู้ใช้ที่สร้างใหม่
        const [newUser] = await pool.query(
            "SELECT id, discord_id, fullname, email, money, points, role, created_at FROM users WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            status: "success",
            message: "สร้างผู้ใช้สำเร็จ",
            data: newUser[0]
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถสร้างผู้ใช้ได้",
            error: error.message
        });
    }
});

// PUT /admin/users/:id - แก้ไขข้อมูลผู้ใช้ (ต้องมีสิทธิ์)
router.put("/users/:id", verifyToken, canEditUsers, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullname,
            email,
            password, // optional - ถ้าต้องการเปลี่ยน password
            discord_id,
            money,
            points,
            role
        } = req.body;

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const [existingUser] = await pool.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบผู้ใช้นี้"
            });
        }

        // ถ้ามีการเปลี่ยน email ให้เช็คว่าซ้ำหรือไม่
        if (email !== undefined && email !== existingUser[0].email) {
            const [emailCheck] = await pool.query(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Email นี้ถูกใช้งานแล้ว"
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: "error",
                    message: "รูปแบบ Email ไม่ถูกต้อง"
                });
            }
        }

        // สร้าง dynamic update query
        const updates = [];
        const values = [];

        if (fullname !== undefined) {
            updates.push("fullname = ?");
            values.push(fullname);
        }
        if (email !== undefined) {
            updates.push("email = ?");
            values.push(email);
        }
        if (password !== undefined && password.length > 0) {
            // เข้ารหัส password ใหม่
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            values.push(hashedPassword);
        }
        if (discord_id !== undefined) {
            updates.push("discord_id = ?");
            values.push(discord_id || null);
        }
        if (money !== undefined) {
            updates.push("money = ?");
            values.push(money);
        }
        if (points !== undefined) {
            updates.push("points = ?");
            values.push(points);
        }
        if (role !== undefined) {
            updates.push("role = ?");
            values.push(role);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ไม่มีข้อมูลที่จะอัพเดต"
            });
        }

        values.push(id);

        // Execute update
        await pool.query(
            `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
            values
        );

        // ดึงข้อมูลผู้ใช้ที่อัพเดตแล้ว
        const [updatedUser] = await pool.query(
            "SELECT id, discord_id, fullname, email, money, points, role, created_at FROM users WHERE id = ?",
            [id]
        );

        res.json({
            status: "success",
            message: "แก้ไขข้อมูลผู้ใช้สำเร็จ",
            data: updatedUser[0]
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้",
            error: error.message
        });
    }
});

// DELETE /admin/users/:id - ลบผู้ใช้ (ต้องมีสิทธิ์)
router.delete("/users/:id", verifyToken, canEditUsers, async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const [existingUser] = await pool.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบผู้ใช้นี้"
            });
        }

        // ป้องกันการลบตัวเอง
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                status: "error",
                message: "ไม่สามารถลบบัญชีของตัวเองได้"
            });
        }

        // ตรวจสอบว่ามีประวัติการซื้อหรือไม่
        const [transactions] = await pool.query(
            "SELECT COUNT(*) as count FROM transactions WHERE user_id = ?",
            [id]
        );

        if (transactions[0].count > 0) {
            return res.status(400).json({
                status: "error",
                message: `ไม่สามารถลบผู้ใช้ได้ เนื่องจากมีประวัติการซื้อ ${transactions[0].count} รายการ`,
                suggestion: "แนะนำให้เปลี่ยนสถานะหรือ role แทนการลบ"
            });
        }

        // ลบ reviews ของผู้ใช้ก่อน (ถ้ามี)
        await pool.query("DELETE FROM reviews WHERE user_id = ?", [id]);

        // ลบ topups ของผู้ใช้ (ถ้ามี)
        await pool.query("DELETE FROM topups WHERE user_id = ?", [id]);

        // ลบผู้ใช้
        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        res.json({
            status: "success",
            message: "ลบผู้ใช้สำเร็จ"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบผู้ใช้ได้",
            error: error.message
        });
    }
});

// PUT /admin/users/:id/money - เพิ่ม/ลด เงินของผู้ใช้ (ต้องมีสิทธิ์)
router.put("/users/:id/money", verifyToken, canEditUsers, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, action = 'add', reason } = req.body; // action: 'add' or 'subtract'

        if (!amount || amount <= 0) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)"
            });
        }

        // ตรวจสอบว่าผู้ใช้มีอยู่จริง
        const [users] = await pool.query(
            "SELECT id, fullname, email, money FROM users WHERE id = ?",
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบผู้ใช้นี้"
            });
        }

        const user = users[0];
        let newMoney;

        if (action === 'add') {
            newMoney = parseFloat(user.money) + parseFloat(amount);
        } else if (action === 'subtract') {
            newMoney = parseFloat(user.money) - parseFloat(amount);
            
            if (newMoney < 0) {
                return res.status(400).json({
                    status: "error",
                    message: "ยอดเงินไม่เพียงพอ",
                    current_money: parseFloat(user.money),
                    requested_amount: parseFloat(amount)
                });
            }
        } else {
            return res.status(400).json({
                status: "error",
                message: "action ต้องเป็น 'add' หรือ 'subtract' เท่านั้น"
            });
        }

        // อัพเดตยอดเงิน
        await pool.query(
            "UPDATE users SET money = ? WHERE id = ?",
            [newMoney, id]
        );

        res.json({
            status: "success",
            message: `${action === 'add' ? 'เพิ่ม' : 'ลด'}เงินสำเร็จ`,
            data: {
                user_id: parseInt(id),
                fullname: user.fullname,
                previous_money: parseFloat(user.money),
                amount: parseFloat(amount),
                new_money: newMoney,
                action: action,
                reason: reason || null
            }
        });
    } catch (error) {
        console.error("Error updating user money:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถอัพเดตยอดเงินได้",
            error: error.message
        });
    }
});

// ============== REPORTS ==============

// GET /admin/reports/topups - รายงานการเติมเงิน (แบบละเอียด)
router.get("/reports/topups", verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            status, // pending, success, failed
            method,
            user_id,
            date_from,
            date_to,
            search, // search by user name, email, transaction_ref
            limit = 50,
            offset = 0,
            sort = 'newest' // newest, oldest, amount_high, amount_low
        } = req.query;

        let query = `
            SELECT 
                t.id,
                t.user_id,
                t.amount,
                t.method,
                t.transaction_ref,
                t.status,
                t.created_at,
                t.updated_at,
                u.fullname as user_fullname,
                u.email as user_email,
                u.money as user_current_money
            FROM topups t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by status
        if (status) {
            query += " AND t.status = ?";
            params.push(status);
        }

        // Filter by method
        if (method) {
            query += " AND t.method = ?";
            params.push(method);
        }

        // Filter by user_id
        if (user_id) {
            query += " AND t.user_id = ?";
            params.push(user_id);
        }

        // Filter by date range
        if (date_from) {
            query += " AND DATE(t.created_at) >= ?";
            params.push(date_from);
        }

        if (date_to) {
            query += " AND DATE(t.created_at) <= ?";
            params.push(date_to);
        }

        // Search
        if (search) {
            query += " AND (u.fullname LIKE ? OR u.email LIKE ? OR t.transaction_ref LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Sorting
        switch (sort) {
            case 'oldest':
                query += " ORDER BY t.created_at ASC";
                break;
            case 'amount_high':
                query += " ORDER BY t.amount DESC";
                break;
            case 'amount_low':
                query += " ORDER BY t.amount ASC";
                break;
            case 'newest':
            default:
                query += " ORDER BY t.created_at DESC";
                break;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [topups] = await pool.query(query, params);

        // Format response
        const formattedTopups = topups.map(topup => ({
            id: topup.id,
            user: {
                id: topup.user_id,
                fullname: topup.user_fullname,
                email: topup.user_email,
                current_money: parseFloat(topup.user_current_money || 0)
            },
            amount: parseFloat(topup.amount),
            method: topup.method,
            transaction_ref: topup.transaction_ref,
            status: topup.status,
            created_at: topup.created_at,
            updated_at: topup.updated_at
        }));

        // Count total
        let countQuery = `
            SELECT COUNT(*) as total
            FROM topups t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        const countParams = [];

        if (status) {
            countQuery += " AND t.status = ?";
            countParams.push(status);
        }

        if (method) {
            countQuery += " AND t.method = ?";
            countParams.push(method);
        }

        if (user_id) {
            countQuery += " AND t.user_id = ?";
            countParams.push(user_id);
        }

        if (date_from) {
            countQuery += " AND DATE(t.created_at) >= ?";
            countParams.push(date_from);
        }

        if (date_to) {
            countQuery += " AND DATE(t.created_at) <= ?";
            countParams.push(date_to);
        }

        if (search) {
            countQuery += " AND (u.fullname LIKE ? OR u.email LIKE ? OR t.transaction_ref LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        // Calculate summary
        let summaryQuery = `
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(amount), 0) as total_amount,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                COALESCE(SUM(CASE WHEN status = 'success' THEN amount END), 0) as success_amount
            FROM topups t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
        
        if (status) {
            summaryQuery += " AND t.status = ?";
        }
        if (method) {
            summaryQuery += " AND t.method = ?";
        }
        if (user_id) {
            summaryQuery += " AND t.user_id = ?";
        }
        if (date_from) {
            summaryQuery += " AND DATE(t.created_at) >= ?";
        }
        if (date_to) {
            summaryQuery += " AND DATE(t.created_at) <= ?";
        }
        if (search) {
            summaryQuery += " AND (u.fullname LIKE ? OR u.email LIKE ? OR t.transaction_ref LIKE ?)";
        }

        const [summary] = await pool.query(summaryQuery, countParams);

        res.json({
            status: "success",
            data: formattedTopups,
            summary: {
                total_transactions: summary[0].total_transactions,
                total_amount: parseFloat(summary[0].total_amount),
                pending_count: summary[0].pending_count,
                success_count: summary[0].success_count,
                failed_count: summary[0].failed_count,
                success_amount: parseFloat(summary[0].success_amount)
            },
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching topup reports:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงรายงานการเติมเงินได้",
            error: error.message
        });
    }
});

// GET /admin/reports/orders - รายงานการซื้อสินค้า (แบบละเอียดมาก)
router.get("/reports/orders", verifyToken, requireAdmin, async (req, res) => {
    try {
        const {
            user_id,
            date_from,
            date_to,
            search, // search by bill_number, user name, email
            min_amount,
            max_amount,
            limit = 50,
            offset = 0,
            sort = 'newest' // newest, oldest, amount_high, amount_low
        } = req.query;

        let query = `
            SELECT 
                tr.id,
                tr.bill_number,
                tr.user_id,
                tr.total_price,
                tr.created_at,
                tr.updated_at,
                u.fullname as user_fullname,
                u.email as user_email,
                u.money as user_current_money,
                u.role as user_role
            FROM transactions tr
            LEFT JOIN users u ON tr.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by user_id
        if (user_id) {
            query += " AND tr.user_id = ?";
            params.push(user_id);
        }

        // Filter by date range
        if (date_from) {
            query += " AND DATE(tr.created_at) >= ?";
            params.push(date_from);
        }

        if (date_to) {
            query += " AND DATE(tr.created_at) <= ?";
            params.push(date_to);
        }

        // Search
        if (search) {
            query += " AND (tr.bill_number LIKE ? OR u.fullname LIKE ? OR u.email LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Filter by amount range
        if (min_amount) {
            query += " AND tr.total_price >= ?";
            params.push(parseFloat(min_amount));
        }

        if (max_amount) {
            query += " AND tr.total_price <= ?";
            params.push(parseFloat(max_amount));
        }

        // Sorting
        switch (sort) {
            case 'oldest':
                query += " ORDER BY tr.created_at ASC";
                break;
            case 'amount_high':
                query += " ORDER BY tr.total_price DESC";
                break;
            case 'amount_low':
                query += " ORDER BY tr.total_price ASC";
                break;
            case 'newest':
            default:
                query += " ORDER BY tr.created_at DESC";
                break;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [transactions] = await pool.query(query, params);

        // ดึงรายละเอียดสินค้าของแต่ละ order
        const formattedOrders = [];
        for (const transaction of transactions) {
            // ดึง items ของ order นี้
            const [items] = await pool.query(
                `SELECT 
                    ti.id,
                    ti.product_id,
                    ti.quantity,
                    ti.price,
                    ti.license_id,
                    ti.created_at,
                    p.title as product_title,
                    p.image as product_image,
                    p.category_id,
                    c.title as category_title,
                    ps.license_key
                FROM transaction_items ti
                LEFT JOIN products p ON ti.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN product_stock ps ON ti.license_id = ps.id
                WHERE ti.transaction_id = ?`,
                [transaction.id]
            );

            formattedOrders.push({
                id: transaction.id,
                bill_number: transaction.bill_number,
                user: {
                    id: transaction.user_id,
                    fullname: transaction.user_fullname,
                    email: transaction.user_email,
                    current_money: parseFloat(transaction.user_current_money || 0),
                    role: transaction.user_role
                },
                total_price: parseFloat(transaction.total_price),
                items: items.map(item => ({
                    id: item.id,
                    product: {
                        id: item.product_id,
                        title: item.product_title,
                        image: item.product_image,
                        category: {
                            id: item.category_id,
                            title: item.category_title
                        }
                    },
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    license_key: item.license_key,
                    item_created_at: item.created_at
                })),
                total_items: items.length,
                created_at: transaction.created_at,
                updated_at: transaction.updated_at
            });
        }

        // Count total
        let countQuery = `
            SELECT COUNT(*) as total
            FROM transactions tr
            LEFT JOIN users u ON tr.user_id = u.id
            WHERE 1=1
        `;
        const countParams = [];

        if (user_id) {
            countQuery += " AND tr.user_id = ?";
            countParams.push(user_id);
        }

        if (date_from) {
            countQuery += " AND DATE(tr.created_at) >= ?";
            countParams.push(date_from);
        }

        if (date_to) {
            countQuery += " AND DATE(tr.created_at) <= ?";
            countParams.push(date_to);
        }

        if (search) {
            countQuery += " AND (tr.bill_number LIKE ? OR u.fullname LIKE ? OR u.email LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (min_amount) {
            countQuery += " AND tr.total_price >= ?";
            countParams.push(parseFloat(min_amount));
        }

        if (max_amount) {
            countQuery += " AND tr.total_price <= ?";
            countParams.push(parseFloat(max_amount));
        }

        const [countResult] = await pool.query(countQuery, countParams);

        // Calculate summary
        let summaryQuery = `
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COALESCE(AVG(total_price), 0) as average_order_value,
                COALESCE(MAX(total_price), 0) as highest_order,
                COALESCE(MIN(total_price), 0) as lowest_order,
                COUNT(DISTINCT user_id) as unique_customers
            FROM transactions tr
            LEFT JOIN users u ON tr.user_id = u.id
            WHERE 1=1
        `;

        const [summary] = await pool.query(summaryQuery, countParams);

        // Top products sold
        let topProductsQuery = `
            SELECT 
                p.id,
                p.title,
                p.image,
                p.price,
                COUNT(ti.id) as times_sold,
                SUM(ti.quantity) as total_quantity,
                SUM(ti.price * ti.quantity) as total_revenue
            FROM transaction_items ti
            INNER JOIN products p ON ti.product_id = p.id
            INNER JOIN transactions tr ON ti.transaction_id = tr.id
            WHERE 1=1
        `;

        if (date_from) {
            topProductsQuery += " AND DATE(tr.created_at) >= ?";
        }
        if (date_to) {
            topProductsQuery += " AND DATE(tr.created_at) <= ?";
        }

        topProductsQuery += " GROUP BY p.id, p.title, p.image, p.price ORDER BY total_quantity DESC LIMIT 10";

        const topProductsParams = [];
        if (date_from) topProductsParams.push(date_from);
        if (date_to) topProductsParams.push(date_to);

        const [topProducts] = await pool.query(topProductsQuery, topProductsParams);

        res.json({
            status: "success",
            data: formattedOrders,
            summary: {
                total_orders: summary[0].total_orders,
                total_revenue: parseFloat(summary[0].total_revenue),
                average_order_value: parseFloat(summary[0].average_order_value),
                highest_order: parseFloat(summary[0].highest_order),
                lowest_order: parseFloat(summary[0].lowest_order),
                unique_customers: summary[0].unique_customers
            },
            top_products: topProducts.map(p => ({
                id: p.id,
                title: p.title,
                image: p.image,
                price: parseFloat(p.price),
                times_sold: p.times_sold,
                total_quantity: p.total_quantity,
                total_revenue: parseFloat(p.total_revenue)
            })),
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching order reports:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงรายงานการซื้อสินค้าได้",
            error: error.message
        });
    }
});

// ============== PRODUCT STOCK MANAGEMENT ==============

// GET /admin/stock - ดึงรายการ stock ทั้งหมด (ต้องมีสิทธิ์)
router.get("/stock", verifyToken, canManageKeys, async (req, res) => {
    try {
        const {
            product_id,
            sold, // 0 = available, 1 = sold
            search, // search by product name or license_key
            limit = 50,
            offset = 0,
            sort = 'newest' // newest, oldest, product_name
        } = req.query;

        let query = `
            SELECT 
                ps.id,
                ps.product_id,
                ps.license_key,
                ps.sold,
                ps.created_at,
                p.title as product_title,
                p.price as product_price,
                p.image as product_image,
                c.title as category_title
            FROM product_stock ps
            LEFT JOIN products p ON ps.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by product_id
        if (product_id) {
            query += " AND ps.product_id = ?";
            params.push(product_id);
        }

        // Filter by sold status
        if (sold !== undefined) {
            query += " AND ps.sold = ?";
            params.push(sold === 'true' || sold === '1' ? 1 : 0);
        }

        // Search
        if (search) {
            query += " AND (p.title LIKE ? OR ps.license_key LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        // Sorting
        switch (sort) {
            case 'oldest':
                query += " ORDER BY ps.created_at ASC";
                break;
            case 'product_name':
                query += " ORDER BY p.title ASC";
                break;
            case 'newest':
            default:
                query += " ORDER BY ps.created_at DESC";
                break;
        }

        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [stocks] = await pool.query(query, params);

        // Format response
        const formattedStocks = stocks.map(stock => ({
            id: stock.id,
            product: {
                id: stock.product_id,
                title: stock.product_title,
                price: parseFloat(stock.product_price || 0),
                image: stock.product_image,
                category_title: stock.category_title
            },
            license_key: stock.license_key,
            sold: Boolean(stock.sold),
            created_at: stock.created_at
        }));

        // Count total
        let countQuery = `
            SELECT COUNT(*) as total
            FROM product_stock ps
            LEFT JOIN products p ON ps.product_id = p.id
            WHERE 1=1
        `;
        const countParams = [];

        if (product_id) {
            countQuery += " AND ps.product_id = ?";
            countParams.push(product_id);
        }

        if (sold !== undefined) {
            countQuery += " AND ps.sold = ?";
            countParams.push(sold === 'true' || sold === '1' ? 1 : 0);
        }

        if (search) {
            countQuery += " AND (p.title LIKE ? OR ps.license_key LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        // Summary
        let summaryQuery = `
            SELECT 
                COUNT(*) as total_stock,
                COUNT(CASE WHEN sold = 0 THEN 1 END) as available_stock,
                COUNT(CASE WHEN sold = 1 THEN 1 END) as sold_stock
            FROM product_stock ps
            LEFT JOIN products p ON ps.product_id = p.id
            WHERE 1=1
        `;

        const [summary] = await pool.query(summaryQuery, countParams);

        res.json({
            status: "success",
            data: formattedStocks,
            summary: {
                total_stock: summary[0].total_stock,
                available_stock: summary[0].available_stock,
                sold_stock: summary[0].sold_stock
            },
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล stock ได้",
            error: error.message
        });
    }
});

// GET /admin/stock/:id - ดึงข้อมูล stock เดียว (ต้องมีสิทธิ์)
router.get("/stock/:id", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { id } = req.params;

        const [stocks] = await pool.query(
            `SELECT 
                ps.id,
                ps.product_id,
                ps.license_key,
                ps.sold,
                ps.created_at,
                p.title as product_title,
                p.price as product_price,
                p.image as product_image,
                p.subtitle as product_subtitle,
                c.id as category_id,
                c.title as category_title
            FROM product_stock ps
            LEFT JOIN products p ON ps.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE ps.id = ?`,
            [id]
        );

        if (stocks.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ stock นี้"
            });
        }

        const stock = stocks[0];

        // ถ้าถูกขายแล้ว ดึงข้อมูลการซื้อ
        let transaction_info = null;
        if (stock.sold) {
            const [transactions] = await pool.query(
                `SELECT 
                    ti.transaction_id,
                    ti.bill_number,
                    ti.created_at as purchased_at,
                    t.user_id,
                    u.fullname as buyer_name,
                    u.email as buyer_email
                FROM transaction_items ti
                LEFT JOIN transactions t ON ti.transaction_id = t.id
                LEFT JOIN users u ON t.user_id = u.id
                WHERE ti.license_id = ?`,
                [id]
            );

            if (transactions.length > 0) {
                transaction_info = {
                    transaction_id: transactions[0].transaction_id,
                    bill_number: transactions[0].bill_number,
                    purchased_at: transactions[0].purchased_at,
                    buyer: {
                        id: transactions[0].user_id,
                        fullname: transactions[0].buyer_name,
                        email: transactions[0].buyer_email
                    }
                };
            }
        }

        res.json({
            status: "success",
            data: {
                id: stock.id,
                product: {
                    id: stock.product_id,
                    title: stock.product_title,
                    subtitle: stock.product_subtitle,
                    price: parseFloat(stock.product_price || 0),
                    image: stock.product_image,
                    category: {
                        id: stock.category_id,
                        title: stock.category_title
                    }
                },
                license_key: stock.license_key,
                sold: Boolean(stock.sold),
                created_at: stock.created_at,
                transaction_info: transaction_info
            }
        });
    } catch (error) {
        console.error("Error fetching stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล stock ได้",
            error: error.message
        });
    }
});

// POST /admin/stock - เพิ่ม stock ใหม่ (ต้องมีสิทธิ์)
router.post("/stock", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { product_id, license_keys } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!product_id || !license_keys) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ product_id และ license_keys"
            });
        }

        // ตรวจสอบว่า product มีอยู่จริง
        const [product] = await pool.query(
            "SELECT id, title FROM products WHERE id = ?",
            [product_id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบสินค้านี้"
            });
        }

        // แปลง license_keys เป็น array
        let keysArray = [];
        if (typeof license_keys === 'string') {
            // แยกด้วย newline หรือ comma
            keysArray = license_keys
                .split(/[\n,]/)
                .map(k => k.trim())
                .filter(k => k.length > 0);
        } else if (Array.isArray(license_keys)) {
            keysArray = license_keys.filter(k => k && k.trim().length > 0);
        } else {
            return res.status(400).json({
                status: "error",
                message: "รูปแบบ license_keys ไม่ถูกต้อง (ต้องเป็น array หรือ string)"
            });
        }

        if (keysArray.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ไม่มี license keys ที่จะเพิ่ม"
            });
        }

        // เช็คว่ามี license key ซ้ำหรือไม่
        const [existingKeys] = await pool.query(
            `SELECT license_key FROM product_stock 
             WHERE product_id = ? AND license_key IN (?)`,
            [product_id, keysArray]
        );

        if (existingKeys.length > 0) {
            const duplicateKeys = existingKeys.map(k => k.license_key);
            return res.status(400).json({
                status: "error",
                message: "มี license key ซ้ำในระบบ",
                duplicate_keys: duplicateKeys
            });
        }

        // เพิ่ม stock ทีละตัว
        const insertedKeys = [];
        for (const key of keysArray) {
            const [result] = await pool.query(
                "INSERT INTO product_stock (product_id, license_key, sold) VALUES (?, ?, 0)",
                [product_id, key]
            );
            insertedKeys.push({
                id: result.insertId,
                license_key: key
            });
        }

        // อัพเดต stock count ใน products table
        const [stockCount] = await pool.query(
            "SELECT COUNT(*) as count FROM product_stock WHERE product_id = ? AND sold = 0",
            [product_id]
        );

        await pool.query(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stockCount[0].count, product_id]
        );

        res.status(201).json({
            status: "success",
            message: `เพิ่ม ${insertedKeys.length} license keys สำเร็จ`,
            data: {
                product_id: parseInt(product_id),
                product_title: product[0].title,
                added_count: insertedKeys.length,
                new_stock_count: stockCount[0].count,
                added_keys: insertedKeys
            }
        });
    } catch (error) {
        console.error("Error adding stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถเพิ่ม stock ได้",
            error: error.message
        });
    }
});

// PUT /admin/stock/:id - แก้ไข stock (license key) (ต้องมีสิทธิ์)
router.put("/stock/:id", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { id } = req.params;
        const { license_key } = req.body;

        if (!license_key || license_key.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ license_key ใหม่"
            });
        }

        // ตรวจสอบว่า stock มีอยู่จริง
        const [existingStock] = await pool.query(
            "SELECT * FROM product_stock WHERE id = ?",
            [id]
        );

        if (existingStock.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ stock นี้"
            });
        }

        // ตรวจสอบว่า stock ถูกขายแล้วหรือยัง
        if (existingStock[0].sold) {
            return res.status(400).json({
                status: "error",
                message: "ไม่สามารถแก้ไข license key ที่ขายแล้วได้"
            });
        }

        // เช็คว่า license key ใหม่ซ้ำหรือไม่
        const [duplicateCheck] = await pool.query(
            "SELECT id FROM product_stock WHERE product_id = ? AND license_key = ? AND id != ?",
            [existingStock[0].product_id, license_key.trim(), id]
        );

        if (duplicateCheck.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "License key นี้มีอยู่แล้วในสินค้านี้"
            });
        }

        // อัพเดต license key
        await pool.query(
            "UPDATE product_stock SET license_key = ? WHERE id = ?",
            [license_key.trim(), id]
        );

        // ดึงข้อมูลที่อัพเดตแล้ว
        const [updatedStock] = await pool.query(
            `SELECT 
                ps.*,
                p.title as product_title
            FROM product_stock ps
            LEFT JOIN products p ON ps.product_id = p.id
            WHERE ps.id = ?`,
            [id]
        );

        res.json({
            status: "success",
            message: "แก้ไข license key สำเร็จ",
            data: {
                id: updatedStock[0].id,
                product_id: updatedStock[0].product_id,
                product_title: updatedStock[0].product_title,
                license_key: updatedStock[0].license_key,
                sold: Boolean(updatedStock[0].sold),
                created_at: updatedStock[0].created_at
            }
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถแก้ไข stock ได้",
            error: error.message
        });
    }
});

// DELETE /admin/stock/:id - ลบ stock (ต้องมีสิทธิ์)
router.delete("/stock/:id", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่า stock มีอยู่จริง
        const [existingStock] = await pool.query(
            "SELECT * FROM product_stock WHERE id = ?",
            [id]
        );

        if (existingStock.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ stock นี้"
            });
        }

        // ตรวจสอบว่า stock ถูกขายแล้วหรือยัง
        if (existingStock[0].sold) {
            return res.status(400).json({
                status: "error",
                message: "ไม่สามารถลบ stock ที่ขายแล้วได้"
            });
        }

        const product_id = existingStock[0].product_id;

        // ลบ stock
        await pool.query("DELETE FROM product_stock WHERE id = ?", [id]);

        // อัพเดต stock count
        const [stockCount] = await pool.query(
            "SELECT COUNT(*) as count FROM product_stock WHERE product_id = ? AND sold = 0",
            [product_id]
        );

        await pool.query(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stockCount[0].count, product_id]
        );

        res.json({
            status: "success",
            message: "ลบ stock สำเร็จ",
            new_stock_count: stockCount[0].count
        });
    } catch (error) {
        console.error("Error deleting stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบ stock ได้",
            error: error.message
        });
    }
});

// DELETE /admin/stock/bulk - ลบ stock หลายตัวพร้อมกัน (ต้องมีสิทธิ์)
router.delete("/stock/bulk", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { stock_ids } = req.body; // Array of stock IDs

        if (!stock_ids || !Array.isArray(stock_ids) || stock_ids.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ stock_ids (array)"
            });
        }

        // ตรวจสอบว่า stock ทั้งหมดมีอยู่จริง และไม่ได้ขายแล้ว
        const [stocks] = await pool.query(
            "SELECT id, product_id, sold FROM product_stock WHERE id IN (?)",
            [stock_ids]
        );

        if (stocks.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ stock ที่ระบุ"
            });
        }

        // เช็คว่ามี stock ที่ขายแล้วหรือไม่
        const soldStocks = stocks.filter(s => s.sold === 1);
        if (soldStocks.length > 0) {
            return res.status(400).json({
                status: "error",
                message: `มี ${soldStocks.length} stock ที่ขายแล้ว ไม่สามารถลบได้`,
                sold_stock_ids: soldStocks.map(s => s.id)
            });
        }

        // เก็บ product_ids ที่มีการเปลี่ยนแปลง
        const affectedProductIds = [...new Set(stocks.map(s => s.product_id))];

        // ลบ stock ทั้งหมด
        await pool.query("DELETE FROM product_stock WHERE id IN (?)", [stock_ids]);

        // อัพเดต stock count ของแต่ละ product
        for (const product_id of affectedProductIds) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as count FROM product_stock WHERE product_id = ? AND sold = 0",
                [product_id]
            );

            await pool.query(
                "UPDATE products SET stock = ? WHERE id = ?",
                [stockCount[0].count, product_id]
            );
        }

        res.json({
            status: "success",
            message: `ลบ ${stocks.length} stock สำเร็จ`,
            deleted_count: stocks.length,
            affected_products: affectedProductIds
        });
    } catch (error) {
        console.error("Error bulk deleting stock:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบ stock ได้",
            error: error.message
        });
    }
});

export default router;

