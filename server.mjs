import express from "express";
import cors from "cors";

// Import Routes
import databaseRoutes from "./routes/database.routes.js";
import themeRoutes from "./routes/theme.routes.js";
import websiteRoutes from "./routes/website.routes.js";
import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import productsRoutes from "./routes/products.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import topupRoutes from "./routes/topup.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const PORT = process.env.PORT || 3005;
const app = express();

// CORS Configuration
const corsOptions = {
    origin: ['https://www.oxystore.xyz', 'https://oxystore.xyz', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "🚀 OXY Server API",
    });
});

app.use("/database", databaseRoutes);
app.use("/theme", themeRoutes);
app.use("/website", websiteRoutes);
app.use("/auth", authRoutes);
app.use("/categories", categoriesRoutes);
app.use("/products", productsRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/stats", statsRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/topup", topupRoutes);
app.use("/admin", adminRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
