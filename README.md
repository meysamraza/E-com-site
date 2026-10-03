# DevOps E-Commerce Web App

A clean, lightweight e-commerce web application built for DevOps training and deployment labs (CI/CD, containerization, cloud hosting). Designed to be easy to read and understand without complex frameworks or over-engineering.

---

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Templates**: EJS
- **Styling**: Plain modern CSS
- **Database**: PostgreSQL (`pg` library)
- **Authentication**: JWT stored in HTTP-only cookies + bcryptjs
- **File Uploads**: Multer (saved locally to `public/uploads`)

---

## Environment Variables (`.env`)

Configure the app by creating a `.env` file (or copying `.env.example`):

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `3000` |
| `DB_HOST` | PostgreSQL hostname / endpoint | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecom_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD`| Database password | `postgres` |
| `JWT_SECRET` | Secret key for signing auth tokens | `devops_super_secret_jwt_key_2026` |

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Make sure PostgreSQL is running and a database (e.g. `ecom_db`) exists.
   Update `.env` with your database credentials.

3. **Initialize the database** (creates tables and seeds 12 initial products & test accounts):
   ```bash
   npm run db:init
   ```

4. **Start the application**:
   ```bash
   npm start
   ```
   Or for live reloading during development:
   ```bash
   npm run dev
   ```

5. Access the app in your browser at `http://localhost:3000`.

---

## Default Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` |
| **Student** | `student@example.com` | `student123` |

---

## List of Pages & Endpoints

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Home page with product grid and search query |
| `/products/:id` | `GET` | Product details and add-to-cart form |
| `/cart` | `GET` | View cart items and fake payment checkout |
| `/cart/add` | `POST` | Add product to cart |
| `/cart/update` | `POST` | Update item quantity in cart |
| `/cart/remove` | `POST` | Remove product from cart |
| `/cart/clear` | `POST` | Empty shopping cart |
| `/checkout` | `POST` | Simulate checkout payment & record order |
| `/orders` | `GET` | Order history for logged-in user |
| `/login` | `GET`/`POST` | User & Admin authentication |
| `/register` | `GET`/`POST`| New account registration |
| `/logout` | `GET` | Log out and clear session cookie |
| `/admin` | `GET` | Admin dashboard listing products and upload form |
| `/admin/products` | `POST` | Upload product with local image file |
| `/admin/products/:id/delete`| `POST` | Delete an existing product |
| `/health` | `GET` | DevOps Health Check probe (returns HTTP 200) |
