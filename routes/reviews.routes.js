import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// GET /reviews - ดึงรีวิวทั้งหมด
router.get("/", async (req, res) => {
    try {
        const { 
            is_active, 
            rating,
            limit, 
            offset = 0,
            user_id
        } = req.query;
        
        let query = `
            SELECT 
                r.id,
                r.user_id,
                r.review_text,
                r.rating,
                r.is_active,
                r.created_at,
                r.updated_at,
                u.fullname as user_fullname,
                u.email as user_email,
                u.role as user_role
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        
        // Filter by is_active
        if (is_active !== undefined) {
            query += " AND r.is_active = ?";
            params.push(is_active === 'true' ? 1 : 0);
        }
        
        // Filter by rating
        if (rating) {
            query += " AND r.rating = ?";
            params.push(parseInt(rating));
        }
        
        // Filter by user_id
        if (user_id) {
            query += " AND r.user_id = ?";
            params.push(parseInt(user_id));
        }
        
        query += " ORDER BY r.created_at DESC";
        
        // Pagination
        if (limit) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(limit), parseInt(offset));
        }
        
        const [reviews] = await pool.query(query, params);
        
        // Count total reviews
        let countQuery = "SELECT COUNT(*) as total FROM reviews WHERE 1=1";
        const countParams = [];
        
        if (is_active !== undefined) {
            countQuery += " AND is_active = ?";
            countParams.push(is_active === 'true' ? 1 : 0);
        }
        if (rating) {
            countQuery += " AND rating = ?";
            countParams.push(parseInt(rating));
        }
        if (user_id) {
            countQuery += " AND user_id = ?";
            countParams.push(parseInt(user_id));
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        
        // คำนวณค่าเฉลี่ยของ rating
        const [avgRating] = await pool.query(
            "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE is_active = 1"
        );
        
        res.json({
            status: "success",
            data: reviews,
            statistics: {
                averageRating: avgRating[0].average_rating ? parseFloat(avgRating[0].average_rating).toFixed(2) : 0,
                totalActiveReviews: avgRating[0].total_reviews
            },
            pagination: {
                total: countResult[0].total,
                limit: limit ? parseInt(limit) : null,
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลรีวิวได้",
            error: error.message
        });
    }
});

// GET /reviews/active - ดึงเฉพาะรีวิวที่ active
router.get("/active", async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const [reviews] = await pool.query(
            `SELECT 
                r.id,
                r.user_id,
                r.review_text,
                r.rating,
                r.created_at,
                u.fullname as user_fullname,
                u.role as user_role
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.is_active = 1
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );
        
        const [countResult] = await pool.query(
            "SELECT COUNT(*) as total FROM reviews WHERE is_active = 1"
        );
        
        res.json({
            status: "success",
            data: reviews,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching active reviews:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลรีวิวได้",
            error: error.message
        });
    }
});

// GET /reviews/stats - สถิติรีวิว
router.get("/stats", async (req, res) => {
    try {
        // นับจำนวนรีวิวทั้งหมด
        const [totalReviews] = await pool.query(
            "SELECT COUNT(*) as total FROM reviews WHERE is_active = 1"
        );
        
        // คำนวณค่าเฉลี่ย rating
        const [avgRating] = await pool.query(
            "SELECT AVG(rating) as average FROM reviews WHERE is_active = 1"
        );
        
        // นับจำนวนรีวิวแต่ละ rating (1-5 ดาว)
        const [ratingDistribution] = await pool.query(
            `SELECT 
                rating,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews WHERE is_active = 1)) as percentage
             FROM reviews
             WHERE is_active = 1
             GROUP BY rating
             ORDER BY rating DESC`
        );
        
        // รีวิวล่าสุด 5 รายการ
        const [latestReviews] = await pool.query(
            `SELECT 
                r.id,
                r.review_text,
                r.rating,
                r.created_at,
                u.fullname as user_fullname
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.is_active = 1
             ORDER BY r.created_at DESC
             LIMIT 5`
        );
        
        res.json({
            status: "success",
            data: {
                totalReviews: totalReviews[0].total,
                averageRating: avgRating[0].average ? parseFloat(avgRating[0].average).toFixed(2) : 0,
                ratingDistribution: ratingDistribution.map(r => ({
                    rating: r.rating,
                    count: r.count,
                    percentage: parseFloat(r.percentage).toFixed(2)
                })),
                latestReviews: latestReviews
            }
        });
    } catch (error) {
        console.error("Error fetching review stats:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงสถิติรีวิวได้",
            error: error.message
        });
    }
});

// GET /reviews/:id - ดึงรีวิวเดียว
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [reviews] = await pool.query(
            `SELECT 
                r.id,
                r.user_id,
                r.review_text,
                r.rating,
                r.is_active,
                r.created_at,
                r.updated_at,
                u.fullname as user_fullname,
                u.email as user_email,
                u.role as user_role
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        
        if (reviews.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบรีวิวนี้"
            });
        }
        
        res.json({
            status: "success",
            data: reviews[0]
        });
    } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลรีวิวได้",
            error: error.message
        });
    }
});

// POST /reviews - สร้างรีวิวใหม่
router.post("/", async (req, res) => {
    try {
        const { user_id, review_text, rating } = req.body;
        
        // Validation
        if (!user_id || !review_text || !rating) {
            return res.status(400).json({
                status: "error",
                message: "กรุณากรอกข้อมูลให้ครบถ้วน (user_id, review_text, rating)"
            });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                status: "error",
                message: "Rating ต้องอยู่ระหว่าง 1-5"
            });
        }
        
        // ตรวจสอบว่า user มีอยู่จริง
        const [users] = await pool.query(
            "SELECT id FROM users WHERE id = ?",
            [user_id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบผู้ใช้นี้"
            });
        }
        
        const [result] = await pool.query(
            "INSERT INTO reviews (user_id, review_text, rating) VALUES (?, ?, ?)",
            [user_id, review_text, rating]
        );
        
        // ดึงข้อมูลรีวิวที่เพิ่งสร้าง
        const [newReview] = await pool.query(
            `SELECT 
                r.*,
                u.fullname as user_fullname,
                u.email as user_email
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            status: "success",
            message: "สร้างรีวิวสำเร็จ",
            data: newReview[0]
        });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถสร้างรีวิวได้",
            error: error.message
        });
    }
});

// PUT /reviews/:id - อัพเดทรีวิว
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { review_text, rating, is_active } = req.body;
        
        // ตรวจสอบว่ารีวิวมีอยู่จริง
        const [existingReview] = await pool.query(
            "SELECT * FROM reviews WHERE id = ?",
            [id]
        );
        
        if (existingReview.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบรีวิวนี้"
            });
        }
        
        // สร้าง query แบบ dynamic
        const updates = [];
        const params = [];
        
        if (review_text !== undefined) {
            updates.push("review_text = ?");
            params.push(review_text);
        }
        
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    status: "error",
                    message: "Rating ต้องอยู่ระหว่าง 1-5"
                });
            }
            updates.push("rating = ?");
            params.push(rating);
        }
        
        if (is_active !== undefined) {
            updates.push("is_active = ?");
            params.push(is_active ? 1 : 0);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "ไม่มีข้อมูลที่ต้องการอัพเดท"
            });
        }
        
        params.push(id);
        
        await pool.query(
            `UPDATE reviews SET ${updates.join(", ")} WHERE id = ?`,
            params
        );
        
        // ดึงข้อมูลรีวิวที่อัพเดท
        const [updatedReview] = await pool.query(
            `SELECT 
                r.*,
                u.fullname as user_fullname,
                u.email as user_email
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        
        res.json({
            status: "success",
            message: "อัพเดทรีวิวสำเร็จ",
            data: updatedReview[0]
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถอัพเดทรีวิวได้",
            error: error.message
        });
    }
});

// DELETE /reviews/:id - ลบรีวิว
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // ตรวจสอบว่ารีวิวมีอยู่จริง
        const [existingReview] = await pool.query(
            "SELECT * FROM reviews WHERE id = ?",
            [id]
        );
        
        if (existingReview.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบรีวิวนี้"
            });
        }
        
        await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
        
        res.json({
            status: "success",
            message: "ลบรีวิวสำเร็จ"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบรีวิวได้",
            error: error.message
        });
    }
});

// PATCH /reviews/:id/toggle-active - เปลี่ยนสถานะ active/inactive
router.patch("/:id/toggle-active", async (req, res) => {
    try {
        const { id } = req.params;
        
        // ตรวจสอบว่ารีวิวมีอยู่จริง
        const [existingReview] = await pool.query(
            "SELECT * FROM reviews WHERE id = ?",
            [id]
        );
        
        if (existingReview.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบรีวิวนี้"
            });
        }
        
        // Toggle is_active
        const newActiveStatus = existingReview[0].is_active ? 0 : 1;
        
        await pool.query(
            "UPDATE reviews SET is_active = ? WHERE id = ?",
            [newActiveStatus, id]
        );
        
        // ดึงข้อมูลรีวิวที่อัพเดท
        const [updatedReview] = await pool.query(
            `SELECT 
                r.*,
                u.fullname as user_fullname,
                u.email as user_email
             FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        
        res.json({
            status: "success",
            message: `${newActiveStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}รีวิวสำเร็จ`,
            data: updatedReview[0]
        });
    } catch (error) {
        console.error("Error toggling review status:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถเปลี่ยนสถานะรีวิวได้",
            error: error.message
        });
    }
});

export default router;

