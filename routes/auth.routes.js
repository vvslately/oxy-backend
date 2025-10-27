import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import verifyToken from "../middleware/auth.middleware.js";

const router = express.Router();
const SECRET_KEY = "2876dffe3fbf1875587e7393530672da";

// Signup - สมัครสมาชิก
router.post("/signup", async (req, res) => {
    try {
        const { fullname, email, password, discord_id } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!fullname || !email || !password) {
            return res.status(400).json({
                status: "error",
                message: "กรุณากรอกข้อมูลให้ครบถ้วน"
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

        // เข้ารหัส password
        const hashedPassword = await bcrypt.hash(password, 10);

        // บันทึกข้อมูลผู้ใช้ใหม่
        const [result] = await pool.query(
            "INSERT INTO users (fullname, email, password, discord_id, role) VALUES (?, ?, ?, ?, ?)",
            [fullname, email, hashedPassword, discord_id || null, "member"]
        );

        // สร้าง JWT token
        const token = jwt.sign(
            {
                id: result.insertId,
                email: email,
                fullname: fullname,
                role: "member"
            },
            SECRET_KEY,
            { expiresIn: "7d" } // token หมดอายุใน 7 วัน
        );

        res.status(201).json({
            status: "success",
            message: "สมัครสมาชิกสำเร็จ",
            data: {
                token,
                user: {
                    id: result.insertId,
                    fullname,
                    email,
                    role: "member"
                }
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถสมัครสมาชิกได้",
            error: error.message
        });
    }
});

// Login - เข้าสู่ระบบ
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "กรุณากรอก Email และ Password"
            });
        }

        // ค้นหาผู้ใช้
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Email หรือ Password ไม่ถูกต้อง"
            });
        }

        const user = users[0];

        // ตรวจสอบ password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: "error",
                message: "Email หรือ Password ไม่ถูกต้อง"
            });
        }

        // สร้าง JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                role: user.role
            },
            SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.json({
            status: "success",
            message: "เข้าสู่ระบบสำเร็จ",
            data: {
                token,
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    discord_id: user.discord_id,
                    money: user.money,
                    points: user.points,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถเข้าสู่ระบบได้",
            error: error.message
        });
    }
});

// My Profile - ดึงข้อมูลโปรไฟล์ (ต้อง login ก่อน)
router.get("/my-profile", verifyToken, async (req, res) => {
    try {
        // ดึงข้อมูลผู้ใช้จาก database
        const [users] = await pool.query(
            "SELECT id, discord_id, fullname, email, money, points, role, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูลผู้ใช้"
            });
        }

        // ดึงข้อมูลคำสั่งซื้อและยอดใช้จ่ายทั้งหมด
        const [orderStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_price), 0) as total_spending
             FROM transactions 
             WHERE user_id = ?`,
            [req.user.id]
        );

        const user = users[0];
        const userData = {
            ...user,
            total_orders: orderStats[0].total_orders,
            total_spending: parseFloat(orderStats[0].total_spending),
            is_admin: user.role === 'admin'
        };

        res.json({
            status: "success",
            data: userData
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลโปรไฟล์ได้",
            error: error.message
        });
    }
});

// My Role - เช็คยศและสิทธิ์ (ต้อง login ก่อน)
router.get("/my-role", verifyToken, async (req, res) => {
    try {
        // ดึงข้อมูล role ของผู้ใช้จาก database
        const [users] = await pool.query(
            "SELECT id, fullname, email, role FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูลผู้ใช้"
            });
        }

        const user = users[0];
        
        // ถ้า role เป็น string ที่ตรงกับ rank_name ในตาราง roles ให้ดึง permissions มาด้วย
        const [rolePermissions] = await pool.query(
            "SELECT * FROM roles WHERE rank_name = ?",
            [user.role]
        );

        // สร้าง response data
        const roleData = {
            user_id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            is_admin: user.role === 'admin',
            permissions: null
        };

        // ถ้าพบ role ในตาราง roles ให้เพิ่ม permissions
        if (rolePermissions.length > 0) {
            const permissions = rolePermissions[0];
            roleData.permissions = {
                can_edit_categories: Boolean(permissions.can_edit_categories),
                can_edit_products: Boolean(permissions.can_edit_products),
                can_edit_users: Boolean(permissions.can_edit_users),
                can_edit_orders: Boolean(permissions.can_edit_orders),
                can_manage_keys: Boolean(permissions.can_manage_keys),
                can_view_reports: Boolean(permissions.can_view_reports),
                can_manage_promotions: Boolean(permissions.can_manage_promotions),
                can_manage_settings: Boolean(permissions.can_manage_settings),
                can_access_reseller_price: Boolean(permissions.can_access_reseller_price)
            };
        }

        res.json({
            status: "success",
            data: roleData
        });
    } catch (error) {
        console.error("Get role error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลยศได้",
            error: error.message
        });
    }
});

export default router;

