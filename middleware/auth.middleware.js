import jwt from "jsonwebtoken";

const SECRET_KEY = "2876dffe3fbf1875587e7393530672da";

// Middleware สำหรับตรวจสอบ JWT Token
export const verifyToken = (req, res, next) => {
    try {
        // ดึง token จากหลายแหล่ง
        let token = null;
        
        // 1. ตรวจสอบจาก Authorization header (Bearer TOKEN)
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // ตัด "Bearer " ออก
            } else {
                token = authHeader; // ถ้าส่งมาแค่ token เฉยๆ
            }
        }
        
        // 2. ตรวจสอบจาก header 'auth_token' (ใช้บ่อยในระบบ)
        if (!token && req.headers.auth_token) {
            token = req.headers.auth_token;
        }
        
        // 3. ตรวจสอบจาก header 'token' โดยตรง
        if (!token && req.headers.token) {
            token = req.headers.token;
        }
        
        // 4. ตรวจสอบจาก header 'x-auth-token'
        if (!token && req.headers['x-auth-token']) {
            token = req.headers['x-auth-token'];
        }
        
        // 5. ตรวจสอบจาก query parameter (?token=xxx)
        if (!token && req.query.token) {
            token = req.query.token;
        }
        
        // 6. ตรวจสอบจาก query parameter (?auth_token=xxx)
        if (!token && req.query.auth_token) {
            token = req.query.auth_token;
        }
        
        // 7. ตรวจสอบจาก body
        if (!token && req.body.token) {
            token = req.body.token;
        }
        
        // 8. ตรวจสอบจาก body.auth_token
        if (!token && req.body.auth_token) {
            token = req.body.auth_token;
        }
        
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "ไม่พบ Token - กรุณา Login ก่อน"
            });
        }

        // ตรวจสอบ token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // เก็บข้อมูล user ไว้ใน req.user
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                status: "error",
                message: "Token หมดอายุ - กรุณา Login ใหม่"
            });
        }
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                status: "error",
                message: "Token ไม่ถูกต้อง",
                error: error.message
            });
        }
        
        return res.status(401).json({
            status: "error",
            message: "การตรวจสอบ Token ล้มเหลว",
            error: error.message
        });
    }
};

export default verifyToken;

