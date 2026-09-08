# NovaStore - Modern Single-Vendor E-Commerce Platform

NovaStore is a full-featured single-vendor multi-category e-commerce platform with an AI-powered Admin Copilot, integrated returns management, GST invoicing, order tracking, and dynamic product catalog.

---

## 🏗️ Architecture

```
├── backend/    # Node.js, Express, MongoDB (Mongoose), JWT, Cloudinary
├── frontend/   # Customer Storefront (React 19, Vite, Tailwind CSS, Framer Motion)
├── admin/      # Admin Panel & AI Copilot (React 19, Vite, Tailwind CSS, Lucide)
└── render.yaml # 1-Click Render Blueprint configuration
```

---

## 🚀 Live Deployment on Render

This repository includes a `render.yaml` Blueprint to deploy all 3 services automatically on Render:

1. **Backend Web Service**: Node.js REST API with rate-limiting, Helmet, CORS, and MongoDB Atlas.
2. **Customer Storefront**: Fast static SPA on Render with automatic SPA routing.
3. **Admin Dashboard**: Secure static SPA with JWT authentication and Admin AI Copilot.

### Steps to Deploy:
1. Fork or push this repository to your GitHub account (`nova-ecommerce` or `nova-ecomerce`).
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **Blueprints** -> **New Blueprint Instance**.
3. Select your `nova-ecomerce` repository.
4. Fill in the environment variables:
   - `MONGODB_URL`: Your MongoDB Atlas URI.
   - `ADMIN_PASSWORD`: Secure password for initial admin login.
   - `CORS_ORIGINS`: Comma-separated URLs of your Storefront & Admin.
   - `VITE_API_URL`: Your deployed backend service URL (e.g. `https://nova-ecommerce-backend.onrender.com/api/v1`).
   - `GEMINI_API_KEY`: (Optional) Free Google Gemini API key from Google AI Studio.

---

## 💻 Local Development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas URI
npm run dev
```

### 2. Admin Dashboard
```bash
cd admin
npm install
npm run dev
# Running on http://localhost:5174
```

### 3. Customer Storefront
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🤖 Admin AI Copilot Features
- **Store Analytics & KPIs**: Instant summary of sales, returns, low-stock items.
- **Dynamic Catalog Operations**: Create new products, adjust pricing, update stock units.
- **Fulfillment & Order Control**: Mark delivered/shipped, manage returns & refunds.
- **Coupon Management**: Create or delete promotional discount codes.
- **Safety Gate**: Modifying actions require one-click or conversational ("k") confirmation.
