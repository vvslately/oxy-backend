import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// ดึงข้อมูลสีจาก theme_settings
router.get("/colors", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT primary_color, secondary_color, background_color, text_color, theme_mode FROM theme_settings LIMIT 1"
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูลสี"
            });
        }
        
        res.json({
            status: "success",
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching colors:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูลสีได้",
            error: error.message
        });
    }
});

export default router;

