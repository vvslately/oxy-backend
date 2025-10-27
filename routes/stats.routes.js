import express from "express";
import pool from "../config/database.js";

const router = express.Router();

// GET /stats - ดึงสถิติทั้งหมด
router.get("/", async (req, res) => {
    try {
        // นับจำนวนสินค้าทั้งหมดที่ active
        const [productCount] = await pool.query(
            "SELECT COUNT(*) as total FROM products WHERE isActive = 1"
        );

        // นับจำนวนผู้ใช้ทั้งหมด
        const [userCount] = await pool.query(
            "SELECT COUNT(*) as total FROM users"
        );

        // นับจำนวนยอดขาย (transactions)
        const [transactionCount] = await pool.query(
            "SELECT COUNT(*) as total FROM transactions"
        );

        // คำนวณยอดขายรวมทั้งหมด
        const [totalRevenue] = await pool.query(
            "SELECT COALESCE(SUM(total_price), 0) as total FROM transactions"
        );

        // นับจำนวน stock คงเหลือทั้งหมด (license keys ที่ยังไม่ขาย)
        const [stockCount] = await pool.query(
            "SELECT COUNT(*) as total FROM product_stock WHERE sold = 0"
        );

        // นับจำนวน stock ที่ขายแล้ว
        const [soldCount] = await pool.query(
            "SELECT COUNT(*) as total FROM product_stock WHERE sold = 1"
        );

        // นับจำนวน categories ที่ active
        const [categoryCount] = await pool.query(
            "SELECT COUNT(*) as total FROM categories WHERE isActive = 1"
        );

        // ยอดขายวันนี้
        const [todayRevenue] = await pool.query(
            `SELECT COALESCE(SUM(total_price), 0) as total 
             FROM transactions 
             WHERE DATE(created_at) = CURDATE()`
        );

        // นับจำนวนคำสั่งซื้อวันนี้
        const [todayOrders] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM transactions 
             WHERE DATE(created_at) = CURDATE()`
        );

        // ยอดขายเดือนนี้
        const [monthRevenue] = await pool.query(
            `SELECT COALESCE(SUM(total_price), 0) as total 
             FROM transactions 
             WHERE YEAR(created_at) = YEAR(CURDATE()) 
             AND MONTH(created_at) = MONTH(CURDATE())`
        );

        // นับจำนวนคำสั่งซื้อเดือนนี้
        const [monthOrders] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM transactions 
             WHERE YEAR(created_at) = YEAR(CURDATE()) 
             AND MONTH(created_at) = MONTH(CURDATE())`
        );

        res.json({
            status: "success",
            data: {
                products: {
                    total: productCount[0].total,
                    categories: categoryCount[0].total
                },
                users: {
                    total: userCount[0].total
                },
                orders: {
                    total: transactionCount[0].total,
                    today: todayOrders[0].total,
                    thisMonth: monthOrders[0].total
                },
                revenue: {
                    total: parseFloat(totalRevenue[0].total),
                    today: parseFloat(todayRevenue[0].total),
                    thisMonth: parseFloat(monthRevenue[0].total)
                },
                stock: {
                    available: stockCount[0].total,
                    sold: soldCount[0].total,
                    total: stockCount[0].total + soldCount[0].total
                }
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

// GET /stats/products - สถิติเฉพาะสินค้า
router.get("/products", async (req, res) => {
    try {
        // สินค้าทั้งหมด
        const [totalProducts] = await pool.query(
            "SELECT COUNT(*) as total FROM products WHERE isActive = 1"
        );

        // สินค้าที่มี stock
        const [inStockProducts] = await pool.query(
            `SELECT COUNT(DISTINCT product_id) as total 
             FROM product_stock 
             WHERE sold = 0`
        );

        // สินค้าที่ featured
        const [featuredProducts] = await pool.query(
            "SELECT COUNT(*) as total FROM products WHERE featured = 1 AND isActive = 1"
        );

        // สินค้าที่ special
        const [specialProducts] = await pool.query(
            "SELECT COUNT(*) as total FROM products WHERE isSpecial = 1 AND isActive = 1"
        );

        // Top 5 สินค้าขายดี
        const [topProducts] = await pool.query(
            `SELECT p.id, p.title, COUNT(ti.id) as sales_count, SUM(ti.quantity) as total_quantity
             FROM products p
             LEFT JOIN transaction_items ti ON p.id = ti.product_id
             WHERE p.isActive = 1
             GROUP BY p.id, p.title
             ORDER BY sales_count DESC
             LIMIT 5`
        );

        res.json({
            status: "success",
            data: {
                total: totalProducts[0].total,
                inStock: inStockProducts[0].total,
                featured: featuredProducts[0].total,
                special: specialProducts[0].total,
                topSelling: topProducts
            }
        });
    } catch (error) {
        console.error("Error fetching product stats:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงสถิติสินค้าได้",
            error: error.message
        });
    }
});

// GET /stats/sales - สถิติการขาย
router.get("/sales", async (req, res) => {
    try {
        const { period = 'all' } = req.query;

        let dateFilter = '';
        if (period === 'today') {
            dateFilter = 'WHERE DATE(created_at) = CURDATE()';
        } else if (period === 'week') {
            dateFilter = 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
            dateFilter = 'WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
        } else if (period === 'year') {
            dateFilter = 'WHERE YEAR(created_at) = YEAR(CURDATE())';
        }

        // ยอดขายทั้งหมด
        const [totalSales] = await pool.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_price), 0) as total_revenue,
                COALESCE(AVG(total_price), 0) as average_order_value
             FROM transactions 
             ${dateFilter}`
        );

        // จำนวนสินค้าที่ขายไป
        const [itemsSold] = await pool.query(
            `SELECT COALESCE(SUM(ti.quantity), 0) as total_items
             FROM transaction_items ti
             JOIN transactions t ON ti.transaction_id = t.id
             ${dateFilter.replace('WHERE', 'WHERE')}`
        );

        // ยอดขายแยกตาม category
        const [salesByCategory] = await pool.query(
            `SELECT 
                c.title as category_name,
                COUNT(DISTINCT t.id) as order_count,
                COALESCE(SUM(ti.quantity), 0) as items_sold,
                COALESCE(SUM(ti.price * ti.quantity), 0) as revenue
             FROM transactions t
             JOIN transaction_items ti ON t.id = ti.transaction_id
             JOIN products p ON ti.product_id = p.id
             JOIN categories c ON p.category_id = c.id
             ${dateFilter}
             GROUP BY c.id, c.title
             ORDER BY revenue DESC`
        );

        // ยอดขายรายวัน (7 วันล่าสุด)
        const [dailySales] = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                COALESCE(SUM(total_price), 0) as revenue
             FROM transactions
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        res.json({
            status: "success",
            data: {
                period: period,
                overview: {
                    totalOrders: totalSales[0].total_orders,
                    totalRevenue: parseFloat(totalSales[0].total_revenue),
                    averageOrderValue: parseFloat(totalSales[0].average_order_value),
                    totalItemsSold: parseInt(itemsSold[0].total_items)
                },
                byCategory: salesByCategory.map(cat => ({
                    category: cat.category_name,
                    orders: cat.order_count,
                    itemsSold: parseInt(cat.items_sold),
                    revenue: parseFloat(cat.revenue)
                })),
                dailySales: dailySales.map(day => ({
                    date: day.date,
                    orders: day.orders,
                    revenue: parseFloat(day.revenue)
                }))
            }
        });
    } catch (error) {
        console.error("Error fetching sales stats:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงสถิติการขายได้",
            error: error.message
        });
    }
});

// GET /stats/users - สถิติผู้ใช้
router.get("/users", async (req, res) => {
    try {
        // จำนวนผู้ใช้ทั้งหมด
        const [totalUsers] = await pool.query(
            "SELECT COUNT(*) as total FROM users"
        );

        // จำนวนผู้ใช้แยกตาม role
        const [usersByRole] = await pool.query(
            `SELECT role, COUNT(*) as count 
             FROM users 
             GROUP BY role 
             ORDER BY count DESC`
        );

        // ผู้ใช้ที่ลงทะเบียนวันนี้
        const [newUsersToday] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM users 
             WHERE DATE(created_at) = CURDATE()`
        );

        // ผู้ใช้ที่ลงทะเบียนเดือนนี้
        const [newUsersThisMonth] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM users 
             WHERE YEAR(created_at) = YEAR(CURDATE()) 
             AND MONTH(created_at) = MONTH(CURDATE())`
        );

        // Top 5 ลูกค้าที่ซื้อมากที่สุด
        const [topCustomers] = await pool.query(
            `SELECT 
                u.id,
                u.fullname,
                u.email,
                COUNT(t.id) as total_orders,
                COALESCE(SUM(t.total_price), 0) as total_spent
             FROM users u
             LEFT JOIN transactions t ON u.id = t.user_id
             GROUP BY u.id, u.fullname, u.email
             ORDER BY total_spent DESC
             LIMIT 5`
        );

        res.json({
            status: "success",
            data: {
                total: totalUsers[0].total,
                newToday: newUsersToday[0].total,
                newThisMonth: newUsersThisMonth[0].total,
                byRole: usersByRole.map(role => ({
                    role: role.role,
                    count: role.count
                })),
                topCustomers: topCustomers.map(customer => ({
                    id: customer.id,
                    name: customer.fullname,
                    email: customer.email,
                    totalOrders: customer.total_orders,
                    totalSpent: parseFloat(customer.total_spent)
                }))
            }
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงสถิติผู้ใช้ได้",
            error: error.message
        });
    }
});

export default router;

