# SQA Test Report & Deployment Guide

**Application**: DevOps E-Commerce Web App  
**Platform**: Node.js 20, Express, PostgreSQL, EJS  
**Date**: October 3, 2026  
**Status**: All Tests Passed (10/10)  

---

## 🔑 Default Credentials & Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | Full catalog management, product uploads (`/admin`), product deletion |
| **Student** | `student@example.com` | `student123` | Browsing, search, cart management, simulated checkout, order history |

### Default Database Configuration
- **Host**: `localhost` (or `127.0.0.1`)
- **Port**: `5432`
- **Database**: `ecom_db`
- **Username**: `postgres`
- **Password**: `postgres`

---

## 📋 SQA Test Matrix (10 User Flows)

| # | Test Case / User Flow | Status | Root Cause & Implemented Fix |
| :---: | :--- | :---: | :--- |
| **1** | **GET /health returns 200** | **PASS** | Returns HTTP 200 with `{ status: "ok", database: "connected", uptime: ... }`. Catches DB errors gracefully without crashing. |
| **2** | **Home page loads & shows seeded products** | **PASS** | Verified that all 12 seeded items render with name, image, description, and price. |
| **3** | **Search filtering & empty state message** | **PASS** | Matching terms filter accurately; searches yielding 0 matches display a clean *"No products found"* alert. |
| **4** | **Product detail page & invalid ID gives clean 404** | **PASS** | **Fixed**: Invalid IDs (e.g. `/products/999999` or `/products/abc`) previously redirected. Implemented ID parsing, HTTP 404 status code, and added `views/404.ejs`. |
| **5** | **User registration & login (wrong password rejected)** | **PASS** | **Fixed**: Updated `POST /login` to explicitly return HTTP 401 on failed authentication. Correct credentials issue JWT in cookie. |
| **6** | **Cart operations (add, change quantity, remove)** | **PASS** | **Fixed**: Cart previously only had add and remove. Added `POST /cart/update` and quantity modifier input controls in `views/cart.ejs`. |
| **7** | **Checkout creates order & shows in history** | **PASS** | Simulated checkout writes to `orders` and `order_items` tables, clears the cart, and redirects to `/orders`. |
| **8** | **Admin adds product with image upload** | **PASS** | **Fixed**: The bcrypt hash for `admin123` in `seed.sql` was mismatched, blocking admin login. Updated seed hashes. Multer successfully stores uploaded images to `public/uploads/` and serves them. |
| **9** | **Normal user cannot open admin page** | **PASS** | Non-admin users attempting to access `/admin` receive HTTP 403 Forbidden. |
| **10** | **Unauthenticated users redirect to login** | **PASS** | Protected routes (`/orders`, `/checkout`, `/admin`) redirect unauthenticated requests to `/login`. |

---

## 🛡️ Reliability & Environment Verification

- **Data Persistence**: Verified by stopping and restarting the server process; newly created products and placed orders remained intact in PostgreSQL.
- **Resilience to DB Drops**: Database errors are caught in route try/catch blocks and process-level safety guards (`uncaughtException`, `unhandledRejection`) prevent the Node.js process from exiting abruptly.
- **Portability**: All file paths strictly use `path.join(__dirname, ...)` with no OS-specific hardcoding. Fully compatible with Linux (Ubuntu, Debian, Amazon Linux, Alpine) and Windows.
- **Host Binding**: Server explicitly binds to `0.0.0.0` (`app.listen(PORT, '0.0.0.0')`) so it is reachable across Docker containers and cloud VMs (e.g., AWS EC2).

---

## 💡 What Students Must Know Before Deploying

### 1. Port Configuration & Firewall
- The app listens on port `3000` on `0.0.0.0`.
- In AWS EC2 Security Groups or firewall settings, ensure inbound TCP traffic on port `3000` is allowed (or configure an Nginx reverse proxy on port 80/443).

### 2. PostgreSQL Database Setup
- Ensure PostgreSQL 14+ is installed and running.
- Run `npm run db:init`:
  - It connects to PostgreSQL and automatically creates the `ecom_db` database if it does not already exist.
  - Applies `schema.sql` (tables for users, products, orders, order items).
  - Applies `seed.sql` (12 products + demo student and admin accounts).

### 3. Environment Variables Reference
Copy `.env.example` to `.env` and adjust as needed:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecom_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=devops_super_secret_jwt_key_2026
```

### 4. Persistent Storage for Uploads
- Admin-uploaded product images are stored locally in `public/uploads/`.
- If containerizing (Docker/Kubernetes), mount a volume to `/app/public/uploads` so uploaded media persists across container lifecycles.
