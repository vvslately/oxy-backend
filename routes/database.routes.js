import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// Test database connection endpoint
router.get("/", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        res.json({
            status: "success",
            message: "เชื่อมต่อ MySQL Database สำเร็จ! ✅",
            database: "oxy",
        });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถเชื่อมต่อ Database ได้ ❌",
            error: error.message
        });
    }
});

// Example: Get all tables in the database


export default router;

