import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// ดึงข้อมูล config ของเว็บไซต์
router.get("/config", async (req, res) => {
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

export default router;

