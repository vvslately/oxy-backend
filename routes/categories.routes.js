import express from "express";
import pool from "../config/database.js";
import verifyToken from "../middleware/auth.middleware.js";
import { canEditCategories } from "../middleware/permission.middleware.js";

const router = express.Router();

// ฟังก์ชันสำหรับสร้าง nested tree structure
async function buildCategoryTree(categories, productCounts, parentId = null) {
    const tree = [];
    
    for (const category of categories) {
        if (category.parent_id === parentId) {
            const children = await buildCategoryTree(categories, productCounts, category.id);
            const node = { ...category };
            
            // เพิ่มจำนวนสินค้าใน category นี้ (เฉพาะตัวเอง)
            const count = productCounts.find(pc => pc.category_id === category.id);
            node.product_count = count ? parseInt(count.count) : 0;
            
            // ถ้ามี children
            if (children.length > 0) {
                node.children = children;
                // คำนวณ total_product_count (รวม children)
                const childrenTotalCount = children.reduce((sum, child) => {
                    return sum + (child.total_product_count || child.product_count || 0);
                }, 0);
                node.total_product_count = node.product_count + childrenTotalCount;
            } else {
                // ไม่มี children ให้ total = product_count
                node.total_product_count = node.product_count;
            }
            
            tree.push(node);
        }
    }
    
    return tree;
}

// GET /categories - ดึง categories ทั้งหมด (แบบ nested tree)
router.get("/", async (req, res) => {
    try {
        const { flat } = req.query; // ?flat=true สำหรับดึงแบบ flat list
        
        const [categories] = await pool.query(
            `SELECT * FROM categories 
             WHERE isActive = 1 
             ORDER BY priority DESC, created_at DESC`
        );
        
        // ดึงจำนวนสินค้าในแต่ละ category
        const [productCounts] = await pool.query(
            `SELECT category_id, COUNT(*) as count 
             FROM products 
             WHERE isActive = 1 
             GROUP BY category_id`
        );
        
        if (flat === 'true') {
            // ส่งแบบ flat list พร้อม product_count
            const categoriesWithCount = categories.map(cat => {
                const count = productCounts.find(pc => pc.category_id === cat.id);
                const productCount = count ? parseInt(count.count) : 0;
                return {
                    ...cat,
                    product_count: productCount,
                    total_product_count: productCount // ใน flat mode ไม่มี children ดังนั้น total = product_count
                };
            });
            
            return res.json({
                status: "success",
                data: categoriesWithCount
            });
        }
        
        // ส่งแบบ nested tree
        const tree = await buildCategoryTree(categories, productCounts);
        
        res.json({
            status: "success",
            data: tree
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล categories ได้",
            error: error.message
        });
    }
});

// GET /categories/featured - ดึง categories ที่ featured
router.get("/featured", async (req, res) => {
    try {
        const [categories] = await pool.query(
            `SELECT * FROM categories 
             WHERE featured = 1 AND isActive = 1 
             ORDER BY priority DESC, created_at DESC`
        );
        
        // ดึงจำนวนสินค้าในแต่ละ category
        const [productCounts] = await pool.query(
            `SELECT category_id, COUNT(*) as count 
             FROM products 
             WHERE isActive = 1 
             GROUP BY category_id`
        );
        
        // เพิ่ม product_count ให้แต่ละ category
        const categoriesWithCount = categories.map(cat => {
            const count = productCounts.find(pc => pc.category_id === cat.id);
            const productCount = count ? parseInt(count.count) : 0;
            return {
                ...cat,
                product_count: productCount,
                total_product_count: productCount // ใน featured mode ไม่รวม children ดังนั้น total = product_count
            };
        });
        
        res.json({
            status: "success",
            data: categoriesWithCount
        });
    } catch (error) {
        console.error("Error fetching featured categories:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล featured categories ได้",
            error: error.message
        });
    }
});

// GET /categories/:id - ดึง category เดียว พร้อม children และ parent
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // ดึงข้อมูล category หลัก
        const [categories] = await pool.query(
            "SELECT * FROM categories WHERE id = ? AND isActive = 1",
            [id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ category นี้"
            });
        }
        
        const category = categories[0];
        
        // ดึง parent category ถ้ามี
        if (category.parent_id) {
            const [parent] = await pool.query(
                "SELECT * FROM categories WHERE id = ?",
                [category.parent_id]
            );
            category.parent = parent[0] || null;
        }
        
        // ดึง children categories
        const [children] = await pool.query(
            "SELECT * FROM categories WHERE parent_id = ? AND isActive = 1 ORDER BY priority DESC",
            [id]
        );
        
        // ดึงจำนวนสินค้าในแต่ละ child category
        if (children.length > 0) {
            const childIds = children.map(child => child.id);
            const [childProductCounts] = await pool.query(
                `SELECT category_id, COUNT(*) as count 
                 FROM products 
                 WHERE category_id IN (${childIds.map(() => '?').join(',')}) AND isActive = 1 
                 GROUP BY category_id`,
                childIds
            );
            
            // เพิ่ม product_count ให้แต่ละ child
            children.forEach(child => {
                const count = childProductCounts.find(pc => pc.category_id === child.id);
                child.product_count = count ? parseInt(count.count) : 0;
            });
            
            category.children = children;
        }
        
        // นับจำนวน products ใน category นี้ (เฉพาะ category นี้ ไม่รวม children)
        const [productCount] = await pool.query(
            "SELECT COUNT(*) as count FROM products WHERE category_id = ? AND isActive = 1",
            [id]
        );
        category.product_count = parseInt(productCount[0].count);
        
        // นับจำนวน products ทั้งหมดรวม children (ถ้ามี children)
        if (children.length > 0) {
            const totalProductCount = children.reduce((sum, child) => {
                return sum + (child.product_count || 0);
            }, category.product_count);
            category.total_product_count = totalProductCount;
        } else {
            category.total_product_count = category.product_count;
        }
        
        res.json({
            status: "success",
            data: category
        });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล category ได้",
            error: error.message
        });
    }
});

// GET /categories/:id/products - ดึง products ของ category นั้น
router.get("/:id/products", async (req, res) => {
    try {
        const { id } = req.params;
        const { includeChildren } = req.query; // ?includeChildren=true รวม products จาก subcategories
        
        let query;
        let params;
        
        if (includeChildren === 'true') {
            // ดึง products จาก category และ subcategories ทั้งหมด
            query = `
                SELECT p.* FROM products p
                WHERE p.isActive = 1 
                AND (p.category_id = ? OR p.category_id IN (
                    SELECT id FROM categories WHERE parent_id = ? AND isActive = 1
                ))
                ORDER BY p.priority DESC, p.created_at DESC
            `;
            params = [id, id];
        } else {
            // ดึงเฉพาะ products ของ category นี้
            query = `
                SELECT * FROM products 
                WHERE category_id = ? AND isActive = 1 
                ORDER BY priority DESC, created_at DESC
            `;
            params = [id];
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
        
        res.json({
            status: "success",
            data: products
        });
    } catch (error) {
        console.error("Error fetching category products:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถดึงข้อมูล products ได้",
            error: error.message
        });
    }
});

// ============== ADMIN ENDPOINTS ==============

// POST /categories - สร้าง category ใหม่ (ต้องมีสิทธิ์)
router.post("/", verifyToken, canEditCategories, async (req, res) => {
    try {
        const {
            parent_id,
            title,
            subtitle,
            image,
            category,
            featured = 0,
            isActive = 1,
            priority = 0
        } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!title) {
            return res.status(400).json({
                status: "error",
                message: "กรุณาระบุชื่อ category"
            });
        }

        // ถ้ามี parent_id ให้เช็คว่า parent มีอยู่จริง
        if (parent_id) {
            const [parentCategory] = await pool.query(
                "SELECT id FROM categories WHERE id = ?",
                [parent_id]
            );

            if (parentCategory.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "ไม่พบ parent category"
                });
            }
        }

        // สร้าง category ใหม่
        const [result] = await pool.query(
            `INSERT INTO categories (parent_id, title, subtitle, image, category, featured, isActive, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [parent_id || null, title, subtitle || null, image || null, category || null, featured, isActive, priority]
        );

        // ดึงข้อมูล category ที่สร้างใหม่
        const [newCategory] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            status: "success",
            message: "สร้าง category สำเร็จ",
            data: newCategory[0]
        });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถสร้าง category ได้",
            error: error.message
        });
    }
});

// PUT /categories/:id - แก้ไข category (ต้องมีสิทธิ์)
router.put("/:id", verifyToken, canEditCategories, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            parent_id,
            title,
            subtitle,
            image,
            category,
            featured,
            isActive,
            priority
        } = req.body;

        // ตรวจสอบว่า category มีอยู่จริง
        const [existingCategory] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );

        if (existingCategory.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ category นี้"
            });
        }

        // ถ้าต้องการเปลี่ยน parent_id
        if (parent_id !== undefined) {
            // เช็คว่าไม่ได้พยายามทำให้ category เป็น parent ของตัวเอง
            if (parseInt(parent_id) === parseInt(id)) {
                return res.status(400).json({
                    status: "error",
                    message: "ไม่สามารถทำให้ category เป็น parent ของตัวเองได้"
                });
            }

            // เช็คว่า parent มีอยู่จริง
            if (parent_id) {
                const [parentCategory] = await pool.query(
                    "SELECT id FROM categories WHERE id = ?",
                    [parent_id]
                );

                if (parentCategory.length === 0) {
                    return res.status(404).json({
                        status: "error",
                        message: "ไม่พบ parent category"
                    });
                }
            }
        }

        // สร้าง dynamic update query
        const updates = [];
        const values = [];

        if (parent_id !== undefined) {
            updates.push("parent_id = ?");
            values.push(parent_id || null);
        }
        if (title !== undefined) {
            updates.push("title = ?");
            values.push(title);
        }
        if (subtitle !== undefined) {
            updates.push("subtitle = ?");
            values.push(subtitle);
        }
        if (image !== undefined) {
            updates.push("image = ?");
            values.push(image);
        }
        if (category !== undefined) {
            updates.push("category = ?");
            values.push(category);
        }
        if (featured !== undefined) {
            updates.push("featured = ?");
            values.push(featured);
        }
        if (isActive !== undefined) {
            updates.push("isActive = ?");
            values.push(isActive);
        }
        if (priority !== undefined) {
            updates.push("priority = ?");
            values.push(priority);
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
            `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
            values
        );

        // ดึงข้อมูล category ที่อัพเดตแล้ว
        const [updatedCategory] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );

        res.json({
            status: "success",
            message: "แก้ไข category สำเร็จ",
            data: updatedCategory[0]
        });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถแก้ไข category ได้",
            error: error.message
        });
    }
});

// DELETE /categories/:id - ลบ category (ต้องมีสิทธิ์)
router.delete("/:id", verifyToken, canEditCategories, async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent = false } = req.query; // ?permanent=true สำหรับลบถาวร

        // ตรวจสอบว่า category มีอยู่จริง
        const [existingCategory] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );

        if (existingCategory.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "ไม่พบ category นี้"
            });
        }

        // ตรวจสอบว่ามี products ใน category นี้หรือไม่
        const [products] = await pool.query(
            "SELECT COUNT(*) as count FROM products WHERE category_id = ? AND isActive = 1",
            [id]
        );

        if (products[0].count > 0) {
            return res.status(400).json({
                status: "error",
                message: `ไม่สามารถลบ category ได้ เนื่องจากมี ${products[0].count} สินค้าในหมวดหมู่นี้`
            });
        }

        // ตรวจสอบว่ามี child categories หรือไม่
        const [children] = await pool.query(
            "SELECT COUNT(*) as count FROM categories WHERE parent_id = ?",
            [id]
        );

        if (children[0].count > 0) {
            return res.status(400).json({
                status: "error",
                message: `ไม่สามารถลบ category ได้ เนื่องจากมี ${children[0].count} หมวดหมู่ย่อย`
            });
        }

        if (permanent === 'true') {
            // ลบถาวร
            await pool.query("DELETE FROM categories WHERE id = ?", [id]);
            
            res.json({
                status: "success",
                message: "ลบ category ถาวรสำเร็จ"
            });
        } else {
            // ซ่อน (soft delete)
            await pool.query(
                "UPDATE categories SET isActive = 0 WHERE id = ?",
                [id]
            );
            
            res.json({
                status: "success",
                message: "ปิดการใช้งาน category สำเร็จ"
            });
        }
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            status: "error",
            message: "ไม่สามารถลบ category ได้",
            error: error.message
        });
    }
});

export default router;

