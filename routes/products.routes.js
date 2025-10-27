import express from "express";
import pool from "../config/database.js";
import verifyToken from "../middleware/auth.middleware.js";
import { canEditProducts, canManageKeys } from "../middleware/permission.middleware.js";

const router = express.Router();

// GET /products - ดึง products ทั้งหมด
router.get("/", async (req, res) => {
    try {
        const { 
            category_id, 
            featured, 
            special, 
            limit, 
            offset = 0,
            search 
        } = req.query;
        
        let query = `
            SELECT p.*, c.title as category_title, c.subtitle as category_subtitle
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.isActive = 1
        `;
        const params = [];
        
        // Filter by category
        if (category_id) {
            query += " AND p.category_id = ?";
            params.push(category_id);
        }
        
        // Filter by featured
        if (featured === 'true') {
            query += " AND p.featured = 1";
        }
        
        // Filter by special
        if (special === 'true') {
            query += " AND p.isSpecial = 1";
        }
        
        // Search by title or subtitle
        if (search) {
            query += " AND (p.title LIKE ? OR p.subtitle LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += " ORDER BY p.priority DESC, p.created_at DESC";
        
        // Pagination
        if (limit) {
            query += " LIMIT ? OFFSET ?";
            params.push(parseInt(limit), parseInt(offset));
        }
        
        const [products] = await pool.query(query, params);
        
        // ดึงจำนวน stock ที่เหลือจริงจาก product_stock
        for (let product of products) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
                [product.id]
            );
            product.available_stock = stockCount[0].available_stock;
        }
        
        // Count total products (for pagination)
        let countQuery = "SELECT COUNT(*) as total FROM products WHERE isActive = 1";
        const countParams = [];
        
        if (category_id) {
            countQuery += " AND category_id = ?";
            countParams.push(category_id);
        }
        if (featured === 'true') {
            countQuery += " AND featured = 1";
        }
        if (special === 'true') {
            countQuery += " AND isSpecial = 1";
        }
        if (search) {
            countQuery += " AND (title LIKE ? OR subtitle LIKE ?)";
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        
        res.json({
            status: "success",
            data: products,
            pagination: {
                total: countResult[0].total,
                limit: limit ? parseInt(limit) : null,
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล products ได้",
            error: error.message
        });
    }
});

// GET /products/featured - ดึง products ที่ featured
router.get("/featured", async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const [products] = await pool.query(
            `SELECT p.*, c.title as category_title 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.featured = 1 AND p.isActive = 1 
             ORDER BY p.priority DESC, p.created_at DESC 
             LIMIT ?`,
            [parseInt(limit)]
        );
        
        // ดึงจำนวน stock ที่เหลือจริงจาก product_stock
        for (let product of products) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
                [product.id]
            );
            product.available_stock = stockCount[0].available_stock;
        }
        
        res.json({
            status: "success",
            data: products
        });
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล featured products ได้",
            error: error.message
        });
    }
});

// GET /products/special - ดึง products ที่ special
router.get("/special", async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const [products] = await pool.query(
            `SELECT p.*, c.title as category_title 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.isSpecial = 1 AND p.isActive = 1 
             ORDER BY p.priority DESC, p.created_at DESC 
             LIMIT ?`,
            [parseInt(limit)]
        );
        
        // ดึงจำนวน stock ที่เหลือจริงจาก product_stock
        for (let product of products) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
                [product.id]
            );
            product.available_stock = stockCount[0].available_stock;
        }
        
        res.json({
            status: "success",
            data: products
        });
    } catch (error) {
        console.error("Error fetching special products:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล special products ได้",
            error: error.message
        });
    }
});

// GET /products/search - ค้นหาสินค้าแบบเฉพาะเจาะจง
router.get("/search", async (req, res) => {
    try {
        const { 
            q, // คำค้นหา
            category_id,
            min_price,
            max_price,
            limit = 20,
            offset = 0,
            sort = 'newest' // newest, oldest, price_low, price_high, name
        } = req.query;
        
        // ตรวจสอบว่ามีคำค้นหาหรือไม่
        if (!q || q.trim() === '') {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุคำค้นหา"
            });
        }
        
        let query = `
            SELECT p.*, c.title as category_title, c.subtitle as category_subtitle
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.isActive = 1
            AND (p.title LIKE ? OR p.subtitle LIKE ? OR c.title LIKE ?)
        `;
        const params = [`%${q}%`, `%${q}%`, `%${q}%`];
        
        // Filter by category
        if (category_id) {
            query += " AND p.category_id = ?";
            params.push(category_id);
        }
        
        // Filter by price range
        if (min_price) {
            query += " AND p.price >= ?";
            params.push(parseFloat(min_price));
        }
        
        if (max_price) {
            query += " AND p.price <= ?";
            params.push(parseFloat(max_price));
        }
        
        // Sorting
        switch (sort) {
            case 'oldest':
                query += " ORDER BY p.created_at ASC";
                break;
            case 'price_low':
                query += " ORDER BY p.price ASC";
                break;
            case 'price_high':
                query += " ORDER BY p.price DESC";
                break;
            case 'name':
                query += " ORDER BY p.title ASC";
                break;
            case 'newest':
            default:
                query += " ORDER BY p.priority DESC, p.created_at DESC";
                break;
        }
        
        // Pagination
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));
        
        const [products] = await pool.query(query, params);
        
        // ดึงจำนวน stock ที่เหลือจริงจาก product_stock
        for (let product of products) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
                [product.id]
            );
            product.available_stock = stockCount[0].available_stock;
        }
        
        // Count total results (for pagination)
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.isActive = 1
            AND (p.title LIKE ? OR p.subtitle LIKE ? OR c.title LIKE ?)
        `;
        const countParams = [`%${q}%`, `%${q}%`, `%${q}%`];
        
        if (category_id) {
            countQuery += " AND p.category_id = ?";
            countParams.push(category_id);
        }
        if (min_price) {
            countQuery += " AND p.price >= ?";
            countParams.push(parseFloat(min_price));
        }
        if (max_price) {
            countQuery += " AND p.price <= ?";
            countParams.push(parseFloat(max_price));
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        
        res.json({
            status: "success",
            data: products,
            search_info: {
                query: q,
                total_results: countResult[0].total,
                filters: {
                    category_id: category_id || null,
                    min_price: min_price || null,
                    max_price: max_price || null,
                    sort: sort
                }
            },
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถค้นหาสินค้าได้",
            error: error.message
        });
    }
});

// GET /products/:id - ดึง product เดียว พร้อมข้อมูล category
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [products] = await pool.query(
            `SELECT p.*, c.title as category_title, c.subtitle as category_subtitle,
                    c.image as category_image
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.isActive = 1`,
            [id]
        );
        
        if (products.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ product นี้"
            });
        }
        
        const product = products[0];
        
        // ดึงจำนวน stock ที่เหลือจริงจาก product_stock
        const [stockCount] = await pool.query(
            "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
            [id]
        );
        product.available_stock = stockCount[0].available_stock;
        
        // ดึง related products (products ใน category เดียวกัน)
        const [relatedProducts] = await pool.query(
            `SELECT * FROM products 
             WHERE category_id = ? AND id != ? AND isActive = 1 
             ORDER BY priority DESC, created_at DESC 
             LIMIT 5`,
            [product.category_id, id]
        );
        
        // ดึงจำนวน stock ของ related products
        for (let relatedProduct of relatedProducts) {
            const [stockCount] = await pool.query(
                "SELECT COUNT(*) as available_stock FROM product_stock WHERE product_id = ? AND sold = 0",
                [relatedProduct.id]
            );
            relatedProduct.available_stock = stockCount[0].available_stock;
        }
        
        product.related_products = relatedProducts;
        
        res.json({
            status: "success",
            data: product
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล product ได้",
            error: error.message
        });
    }
});

// ============== ADMIN ENDPOINTS ==============

// POST /products - สร้าง product ใหม่ (ต้องมีสิทธิ์)
router.post("/", verifyToken, canEditProducts, async (req, res) => {
    try {
        const {
            category_id,
            title,
            subtitle,
            price,
            reseller_price,
            stock = 0,
            duration,
            image,
            download_link,
            isSpecial = 0,
            featured = 0,
            isActive = 1,
            isWarrenty = 0,
            warrenty_text,
            primary_color,
            secondary_color,
            priority = 0,
            discount_percent = 0
        } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!category_id || !title || !price) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ category_id, title และ price"
            });
        }

        // ตรวจสอบว่า category มีอยู่จริง
        const [category] = await pool.query(
            "SELECT id FROM categories WHERE id = ?",
            [category_id]
        );

        if (category.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ category นี้"
            });
        }

        // สร้าง product ใหม่
        const [result] = await pool.query(
            `INSERT INTO products (
                category_id, title, subtitle, price, reseller_price, stock, 
                duration, image, download_link, isSpecial, featured, isActive, 
                isWarrenty, warrenty_text, primary_color, secondary_color, 
                priority, discount_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category_id, title, subtitle || null, price, reseller_price || null, 
                stock, duration || null, image || null, download_link || null, 
                isSpecial, featured, isActive, isWarrenty, warrenty_text || null, 
                primary_color || null, secondary_color || null, priority, discount_percent
            ]
        );

        // ดึงข้อมูล product ที่สร้างใหม่
        const [newProduct] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            status: "success",
            message: "สร้าง product สำเร็จ",
            data: newProduct[0]
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถสร้าง product ได้",
            error: error.message
        });
    }
});

// PUT /products/:id - แก้ไข product (ต้องมีสิทธิ์)
router.put("/:id", verifyToken, canEditProducts, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            title,
            subtitle,
            price,
            reseller_price,
            stock,
            duration,
            image,
            download_link,
            isSpecial,
            featured,
            isActive,
            isWarrenty,
            warrenty_text,
            primary_color,
            secondary_color,
            priority,
            discount_percent
        } = req.body;

        // ตรวจสอบว่า product มีอยู่จริง
        const [existingProduct] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ product นี้"
            });
        }

        // ถ้าต้องการเปลี่ยน category
        if (category_id !== undefined) {
            const [category] = await pool.query(
                "SELECT id FROM categories WHERE id = ?",
                [category_id]
            );

            if (category.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "ไม่พบ category นี้"
                });
            }
        }

        // สร้าง dynamic update query
        const updates = [];
        const values = [];

        if (category_id !== undefined) {
            updates.push("category_id = ?");
            values.push(category_id);
        }
        if (title !== undefined) {
            updates.push("title = ?");
            values.push(title);
        }
        if (subtitle !== undefined) {
            updates.push("subtitle = ?");
            values.push(subtitle);
        }
        if (price !== undefined) {
            updates.push("price = ?");
            values.push(price);
        }
        if (reseller_price !== undefined) {
            updates.push("reseller_price = ?");
            values.push(reseller_price);
        }
        if (stock !== undefined) {
            updates.push("stock = ?");
            values.push(stock);
        }
        if (duration !== undefined) {
            updates.push("duration = ?");
            values.push(duration);
        }
        if (image !== undefined) {
            updates.push("image = ?");
            values.push(image);
        }
        if (download_link !== undefined) {
            updates.push("download_link = ?");
            values.push(download_link);
        }
        if (isSpecial !== undefined) {
            updates.push("isSpecial = ?");
            values.push(isSpecial);
        }
        if (featured !== undefined) {
            updates.push("featured = ?");
            values.push(featured);
        }
        if (isActive !== undefined) {
            updates.push("isActive = ?");
            values.push(isActive);
        }
        if (isWarrenty !== undefined) {
            updates.push("isWarrenty = ?");
            values.push(isWarrenty);
        }
        if (warrenty_text !== undefined) {
            updates.push("warrenty_text = ?");
            values.push(warrenty_text);
        }
        if (primary_color !== undefined) {
            updates.push("primary_color = ?");
            values.push(primary_color);
        }
        if (secondary_color !== undefined) {
            updates.push("secondary_color = ?");
            values.push(secondary_color);
        }
        if (priority !== undefined) {
            updates.push("priority = ?");
            values.push(priority);
        }
        if (discount_percent !== undefined) {
            updates.push("discount_percent = ?");
            values.push(discount_percent);
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
            `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
            values
        );

        // ดึงข้อมูล product ที่อัพเดตแล้ว
        const [updatedProduct] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        res.json({
            status: "success",
            message: "แก้ไข product สำเร็จ",
            data: updatedProduct[0]
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถแก้ไข product ได้",
            error: error.message
        });
    }
});

// DELETE /products/:id - ลบ product (ต้องมีสิทธิ์)
router.delete("/:id", verifyToken, canEditProducts, async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent = false } = req.query; // ?permanent=true สำหรับลบถาวร

        // ตรวจสอบว่า product มีอยู่จริง
        const [existingProduct] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (existingProduct.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ product นี้"
            });
        }

        if (permanent === 'true') {
            // ตรวจสอบว่ามีการขายแล้วหรือไม่
            const [transactions] = await pool.query(
                "SELECT COUNT(*) as count FROM transaction_items WHERE product_id = ?",
                [id]
            );

            if (transactions[0].count > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "ไม่สามารถลบ product ได้ เนื่องจากมีประวัติการขายแล้ว"
                });
            }

            // ลบ stock ก่อน (เพราะมี foreign key)
            await pool.query("DELETE FROM product_stock WHERE product_id = ?", [id]);
            
            // ลบ product
            await pool.query("DELETE FROM products WHERE id = ?", [id]);
            
            res.json({
                status: "success",
                message: "ลบ product ถาวรสำเร็จ"
            });
        } else {
            // ซ่อน (soft delete)
            await pool.query(
                "UPDATE products SET isActive = 0 WHERE id = ?",
                [id]
            );
            
            res.json({
                status: "success",
                message: "ปิดการใช้งาน product สำเร็จ"
            });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบ product ได้",
            error: error.message
        });
    }
});

// ============== STOCK MANAGEMENT ==============

// GET /products/:id/stock - ดึงรายการ stock ของ product (ต้องมีสิทธิ์)
router.get("/:id/stock", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { id } = req.params;
        const { show_sold = false } = req.query; // ?show_sold=true เพื่อดู stock ที่ขายแล้ว

        // ตรวจสอบว่า product มีอยู่จริง
        const [product] = await pool.query(
            "SELECT id, title FROM products WHERE id = ?",
            [id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ product นี้"
            });
        }

        let query = "SELECT * FROM product_stock WHERE product_id = ?";
        const params = [id];

        if (show_sold !== 'true') {
            query += " AND sold = 0";
        }

        query += " ORDER BY created_at DESC";

        const [stock] = await pool.query(query, params);

        res.json({
            status: "success",
            data: {
                product: product[0],
                stock: stock,
                total_stock: stock.length,
                available_stock: stock.filter(s => !s.sold).length,
                sold_stock: stock.filter(s => s.sold).length
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

// POST /products/:id/stock - เพิ่ม stock (ต้องมีสิทธิ์)
router.post("/:id/stock", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { id } = req.params;
        const { license_keys } = req.body; // Array of license keys หรือ single string

        // ตรวจสอบว่า product มีอยู่จริง
        const [product] = await pool.query(
            "SELECT id, title FROM products WHERE id = ?",
            [id]
        );

        if (product.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ product นี้"
            });
        }

        // ตรวจสอบข้อมูล
        if (!license_keys) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุ license_keys"
            });
        }

        // แปลง license_keys เป็น array ถ้าเป็น string
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
            [id, keysArray]
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
                [id, key]
            );
            insertedKeys.push({
                id: result.insertId,
                license_key: key
            });
        }

        // อัพเดต stock count ใน products table
        const [stockCount] = await pool.query(
            "SELECT COUNT(*) as count FROM product_stock WHERE product_id = ? AND sold = 0",
            [id]
        );

        await pool.query(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stockCount[0].count, id]
        );

        res.status(201).json({
            status: "success",
            message: `เพิ่ม ${insertedKeys.length} license keys สำเร็จ`,
            data: {
                product_id: parseInt(id),
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

// DELETE /products/:product_id/stock/:stock_id - ลบ stock เดียว (ต้องมีสิทธิ์)
router.delete("/:product_id/stock/:stock_id", verifyToken, canManageKeys, async (req, res) => {
    try {
        const { product_id, stock_id } = req.params;

        // ตรวจสอบว่า stock มีอยู่จริง
        const [stock] = await pool.query(
            "SELECT * FROM product_stock WHERE id = ? AND product_id = ?",
            [stock_id, product_id]
        );

        if (stock.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ stock นี้"
            });
        }

        // ตรวจสอบว่า stock ถูกขายแล้วหรือยัง
        if (stock[0].sold) {
            return res.status(400).json({
                status: "error",
                message: "ไม่สามารถลบ stock ที่ขายแล้วได้"
            });
        }

        // ลบ stock
        await pool.query("DELETE FROM product_stock WHERE id = ?", [stock_id]);

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

export default router;

