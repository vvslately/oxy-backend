import pool from "../config/database.js";

/**
 * Middleware สำหรับเช็คว่าผู้ใช้เป็น admin หรือไม่
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // ดึงข้อมูลผู้ใช้จาก database
        const [users] = await pool.query(
            "SELECT role FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบข้อมูลผู้ใช้"
            });
        }

        const user = users[0];

        // เช็คว่าเป็น admin หรือไม่
        if (user.role !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น"
            });
        }

        next();
    } catch (error) {
        console.error("Check admin error:", error);
        return res.status(500).json({
            status: "error",
            message: "ไม่สามารถตรวจสอบสิทธิ์ได้",
            error: error.message
        });
    }
};

/**
 * Middleware สำหรับเช็ค permission เฉพาะ
 * @param {string} permission - ชื่อ permission ที่ต้องการเช็ค
 */
export const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            // ดึงข้อมูลผู้ใช้
            const [users] = await pool.query(
                "SELECT role FROM users WHERE id = ?",
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "ไม่พบข้อมูลผู้ใช้"
                });
            }

            const user = users[0];

            // ถ้าเป็น admin ให้ผ่านทันที
            if (user.role === 'admin') {
                return next();
            }

            // ดึง permissions จาก role
            const [rolePermissions] = await pool.query(
                "SELECT * FROM roles WHERE rank_name = ?",
                [user.role]
            );

            // ถ้าไม่พบ role หรือไม่มี permission
            if (rolePermissions.length === 0 || !rolePermissions[0][permission]) {
                return res.status(403).json({
                    status: "error",
                    message: `ไม่มีสิทธิ์ในการดำเนินการนี้ - ต้องมีสิทธิ์ ${permission}`
                });
            }

            next();
        } catch (error) {
            console.error("Check permission error:", error);
            return res.status(500).json({
                status: "error",
                message: "ไม่สามารถตรวจสอบสิทธิ์ได้",
                error: error.message
            });
        }
    };
};

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์แก้ไข categories
 */
export const canEditCategories = requirePermission('can_edit_categories');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์แก้ไข products
 */
export const canEditProducts = requirePermission('can_edit_products');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์จัดการ keys/stock
 */
export const canManageKeys = requirePermission('can_manage_keys');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์แก้ไข users
 */
export const canEditUsers = requirePermission('can_edit_users');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์แก้ไข orders
 */
export const canEditOrders = requirePermission('can_edit_orders');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์ดู reports
 */
export const canViewReports = requirePermission('can_view_reports');

/**
 * Middleware สำหรับเช็คว่ามีสิทธิ์จัดการ settings
 */
export const canManageSettings = requirePermission('can_manage_settings');

export default {
    requireAdmin,
    requirePermission,
    canEditCategories,
    canEditProducts,
    canManageKeys,
    canEditUsers,
    canEditOrders,
    canViewReports,
    canManageSettings
};

