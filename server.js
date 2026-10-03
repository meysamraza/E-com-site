const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'devops_jwt_secret_key_change_me';

// Setup file upload destination
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// View engine & static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Cart cookie helpers
function getCart(req) {
  try {
    return req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  } catch (err) {
    return [];
  }
}

function saveCart(res, cart) {
  res.cookie('cart', JSON.stringify(cart), { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

// Global Auth & Context Middleware
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      res.clearCookie('token');
      req.user = null;
    }
  } else {
    req.user = null;
  }

  const cart = getCart(req);
  res.locals.currentUser = req.user;
  res.locals.cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  res.locals.alertMessage = req.query.msg || null;
  res.locals.errorMessage = req.query.error || null;
  next();
});

// Route Guard Middlewares
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}&error=Please log in first`);
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}&error=Please log in first`);
  }
  if (req.user.role !== 'admin') {
    return res.status(403).render('404', { title: 'Access Denied', message: 'Forbidden: Admin privileges required.' });
  }
  next();
}

// -----------------------------------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(200).json({
      status: 'ok',
      database: 'disconnected',
      error: err.message,
      uptime: process.uptime()
    });
  }
});

// -----------------------------------------------------------------------------
// HOME PAGE (Product Catalog & Search)
// -----------------------------------------------------------------------------
app.get('/', async (req, res) => {
  const searchQuery = req.query.q ? req.query.q.trim() : '';
  try {
    let result;
    if (searchQuery) {
      result = await db.query(
        'SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY id ASC',
        [`%${searchQuery}%`]
      );
    } else {
      result = await db.query('SELECT * FROM products ORDER BY id ASC');
    }
    res.render('index', { products: result.rows, searchQuery, title: 'Shop Gear' });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.render('index', { products: [], searchQuery, title: 'Shop Gear', errorMessage: 'Could not load products. Please ensure the database is initialized.' });
  }
});

// -----------------------------------------------------------------------------
// PRODUCT DETAIL
// -----------------------------------------------------------------------------
app.get('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).render('404', { title: 'Product Not Found', message: 'Invalid product ID.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).render('404', { title: 'Product Not Found', message: 'Product not found.' });
    }
    res.render('product', { product: rows[0], title: rows[0].name });
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).render('404', { title: 'Server Error', message: 'Error fetching product details.' });
  }
});

// -----------------------------------------------------------------------------
// CART & CHECKOUT
// -----------------------------------------------------------------------------
app.get('/cart', async (req, res) => {
  const cart = getCart(req);
  if (cart.length === 0) {
    return res.render('cart', { items: [], totalAmount: 0, title: 'Shopping Cart' });
  }

  try {
    const productIds = cart.map(i => parseInt(i.productId, 10)).filter(Boolean);
    const { rows: products } = await db.query(
      'SELECT * FROM products WHERE id = ANY($1::int[])',
      [productIds]
    );

    let totalAmount = 0;
    const items = cart.map(cartItem => {
      const product = products.find(p => p.id === parseInt(cartItem.productId, 10));
      if (!product) return null;
      const subtotal = Number(product.price) * cartItem.quantity;
      totalAmount += subtotal;
      return { product, quantity: cartItem.quantity, subtotal };
    }).filter(Boolean);

    res.render('cart', { items, totalAmount, title: 'Shopping Cart' });
  } catch (err) {
    console.error('Cart fetch error:', err.message);
    res.render('cart', { items: [], totalAmount: 0, title: 'Shopping Cart', errorMessage: 'Failed to load cart items.' });
  }
});

app.post('/cart/add', (req, res) => {
  const productId = parseInt(req.body.productId, 10);
  const quantity = Math.max(1, parseInt(req.body.quantity || 1, 10));

  let cart = getCart(req);
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  saveCart(res, cart);
  res.redirect('/cart?msg=Item added to cart!');
});

app.post('/cart/remove', (req, res) => {
  const productId = parseInt(req.body.productId, 10);
  let cart = getCart(req);
  cart = cart.filter(item => item.productId !== productId);
  saveCart(res, cart);
  res.redirect('/cart?msg=Item removed from cart.');
});

app.post('/cart/update', (req, res) => {
  const productId = parseInt(req.body.productId, 10);
  const quantity = parseInt(req.body.quantity, 10);
  let cart = getCart(req);
  if (isNaN(quantity) || quantity <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  } else {
    const item = cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  saveCart(res, cart);
  res.redirect('/cart?msg=Cart updated.');
});

app.post('/cart/clear', (req, res) => {
  res.clearCookie('cart');
  res.redirect('/cart?msg=Cart cleared.');
});

app.post('/checkout', requireAuth, async (req, res) => {
  const cart = getCart(req);
  if (cart.length === 0) {
    return res.redirect('/cart?error=Cart is empty');
  }

  try {
    const productIds = cart.map(i => parseInt(i.productId, 10)).filter(Boolean);
    const { rows: products } = await db.query(
      'SELECT * FROM products WHERE id = ANY($1::int[])',
      [productIds]
    );

    let totalAmount = 0;
    const orderItems = [];
    for (const item of cart) {
      const prod = products.find(p => p.id === parseInt(item.productId, 10));
      if (prod) {
        totalAmount += Number(prod.price) * item.quantity;
        orderItems.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: item.quantity
        });
      }
    }

    // Insert into orders table
    const { rows: orderRows } = await db.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, totalAmount, 'Paid', 'Credit Card (Simulated)']
    );
    const orderId = orderRows[0].id;

    // Insert order items
    for (const oi of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [orderId, oi.productId, oi.name, oi.price, oi.quantity]
      );
    }

    res.clearCookie('cart');
    res.redirect(`/orders?msg=Order #${orderId} completed successfully!`);
  } catch (err) {
    console.error('Checkout processing error:', err.message);
    res.redirect('/cart?error=Payment failed. Please try again.');
  }
});

// -----------------------------------------------------------------------------
// ORDERS HISTORY
// -----------------------------------------------------------------------------
app.get('/orders', requireAuth, async (req, res) => {
  try {
    const { rows: orders } = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    for (const order of orders) {
      const { rows: items } = await db.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = items;
    }

    res.render('orders', { orders, title: 'Order History' });
  } catch (err) {
    console.error('Orders fetch error:', err.message);
    res.render('orders', { orders: [], title: 'Order History', errorMessage: 'Could not load your orders.' });
  }
});

// -----------------------------------------------------------------------------
// AUTHENTICATION (Register, Login, Logout)
// -----------------------------------------------------------------------------
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Login', redirect: req.query.redirect || '' });
});

app.post('/login', async (req, res) => {
  const { email, password, redirect } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email ? email.trim() : '']);
    if (rows.length === 0) {
      return res.status(401).render('login', { title: 'Login', redirect, errorMessage: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render('login', { title: 'Login', redirect, errorMessage: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(redirect || '/?msg=Logged in successfully!');
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('login', { title: 'Login', redirect, errorMessage: 'An error occurred during login.' });
  }
});

app.get('/register', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render('register', { title: 'Register', errorMessage: 'All fields are required.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.render('register', { title: 'Register', errorMessage: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.trim(), hashedPassword, 'user']
    );

    const newUser = rows[0];
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/?msg=Account created successfully!');
  } catch (err) {
    console.error('Register error:', err.message);
    res.render('register', { title: 'Register', errorMessage: 'Could not create account: ' + err.message });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login?msg=Logged out successfully.');
});

// -----------------------------------------------------------------------------
// ADMIN (Manage & Upload Products)
// -----------------------------------------------------------------------------
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { rows: products } = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.render('admin', { products, title: 'Admin Dashboard' });
  } catch (err) {
    console.error('Admin page error:', err.message);
    res.render('admin', { products: [], title: 'Admin Dashboard', errorMessage: 'Failed to load products.' });
  }
});

app.post('/admin/products', requireAdmin, upload.single('image'), async (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !price || !req.file) {
    return res.redirect('/admin?error=Name, price, and image are required.');
  }

  try {
    const imageName = req.file.filename;
    await db.query(
      'INSERT INTO products (name, description, price, image) VALUES ($1, $2, $3, $4)',
      [name.trim(), description ? description.trim() : '', parseFloat(price), imageName]
    );
    res.redirect('/admin?msg=Product added successfully!');
  } catch (err) {
    console.error('Admin add product error:', err.message);
    res.redirect('/admin?error=Failed to add product: ' + err.message);
  }
});

app.post('/admin/products/:id/delete', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.redirect('/admin?msg=Product deleted successfully.');
  } catch (err) {
    console.error('Admin delete product error:', err.message);
    res.redirect('/admin?error=Failed to delete product.');
  }
});

// 404 Catch-all Handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', message: 'The page you requested does not exist.' });
});

// Process Error Safety Guards (prevents crashing on db connectivity drops)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Start Server listening on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
});

