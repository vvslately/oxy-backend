# OXY Server API

## 📁 โครงสร้างโปรเจค

```
oxy_server/
├── config/
│   └── database.js          # Database connection configuration
├── routes/
│   └── database.routes.js   # Database-related routes
├── server.mjs               # Main server file
├── package.json             # Project dependencies
└── README.md                # Documentation
```

## 🚀 การติดตั้ง

```bash
npm install
```

## ▶️ การรัน Server

```bash
node server.mjs
```

Server จะทำงานที่ `http://localhost:3001`

## 📡 API Endpoints

### 1. Root Endpoint
- **URL:** `GET /`
- **Description:** แสดงข้อมูลพื้นฐานของ API
- **Response:**
```json
{
  "message": "🚀 OXY Server API",
  "version": "1.0.0",
  "endpoints": {
    "database": "/database - Database connection test",
    "tables": "/database/tables - List all database tables"
  }
}
```

### 2. Database Connection Test
- **URL:** `GET /database`
- **Description:** ทดสอบการเชื่อมต่อกับ MySQL Database
- **Response:**
```json
{
  "status": "success",
  "message": "เชื่อมต่อ MySQL Database สำเร็จ! ✅",
  "database": "oxy",
  "host": "210.246.215.19"
}
```

### 3. List Database Tables
- **URL:** `GET /database/tables`
- **Description:** ดึงรายการ tables ทั้งหมดในฐานข้อมูล
- **Response:**
```json
{
  "status": "success",
  "message": "ดึงรายการ tables สำเร็จ",
  "count": 10,
  "tables": [...]
}
```

## 🗄️ Database Configuration

แก้ไขการตั้งค่าฐานข้อมูลได้ที่ไฟล์ `config/database.js`:

```javascript
const pool = mysql.createPool({
    host: "210.246.215.19",
    user: "oxy_user",
    password: "OxyStrong123!",
    database: "oxy",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
```

## ➕ การเพิ่ม Route ใหม่

1. สร้างไฟล์ใหม่ใน folder `routes/` เช่น `products.routes.js`
2. เขียน routes ตามตัวอย่าง:

```javascript
import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
    // Your code here
});

export default router;
```

3. Import และใช้งานใน `server.mjs`:

```javascript
import productRoutes from "./routes/products.routes.js";
app.use("/products", productRoutes);
```

## 📋 Tables ที่มีในฐานข้อมูล

1. categories
2. config
3. product_stock
4. products
5. roles
6. theme_settings
7. topups
8. transaction_items
9. transactions
10. users

## 🛠️ Technologies

- **Express.js** - Web framework
- **MySQL2** - MySQL client for Node.js
- **CORS** - Cross-Origin Resource Sharing

## 📝 หมายเหตุ

- Server จะทดสอบการเชื่อมต่อฐานข้อมูลอัตโนมัติเมื่อเริ่มต้น
- แยก config และ routes ออกจากกันเพื่อง่ายต่อการจัดการและขยาย

