const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const db = new sqlite3.Database(path.join(DATA_DIR, "megashop.sqlite"));

const run = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function (err) { if (err) reject(err); else resolve({ id: this.lastID, changes: this.changes }); })
);
const get = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || "development-secret-change-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

async function initializeDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 20
  )`);
  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Placed',
    shipping_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  const count = await get("SELECT COUNT(*) AS count FROM products");
  if (count.count === 0) {
    const products = [
      ["Everyday Backpack", "A lightweight everyday backpack with roomy compartments and a clean, minimal look.", 1299, "Accessories", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", 18],
      ["Wireless Headphones", "Comfortable over-ear headphones with rich sound for work, study and travel.", 2499, "Electronics", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", 15],
      ["Classic Wrist Watch", "A timeless everyday watch with a simple dial and comfortable strap.", 1899, "Accessories", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800", 12],
      ["Running Sneakers", "Breathable, cushioned sneakers designed for everyday movement.", 2199, "Fashion", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", 20],
      ["Ceramic Coffee Mug", "A durable ceramic mug for your morning coffee or evening tea.", 399, "Home", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800", 30],
      ["Desk Lamp", "A modern desk lamp that adds warm light to your study or workspace.", 999, "Home", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800", 14],
      ["Sunglasses", "Lightweight sunglasses with a versatile design for sunny days.", 799, "Fashion", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800", 22],
      ["Smart Speaker", "A compact speaker for music, podcasts and everyday listening.", 2999, "Electronics", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800", 10]
    ];
    for (const p of products) {
      // Use a safe fallback for any image URL that may be edited later.
      await run("INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)", p);
    }
  }
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Please log in to continue." });
  next();
}

app.get("/api/products", async (req, res) => {
  try {
    const { search = "", category = "" } = req.query;
    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];
    if (search) { sql += " AND (name LIKE ? OR description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (category && category !== "All") { sql += " AND category = ?"; params.push(category); }
    sql += " ORDER BY id DESC";
    res.json(await all(sql, params));
  } catch { res.status(500).json({ error: "Could not load products." }); }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch { res.status(500).json({ error: "Could not load product." }); }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name.trim(), email.trim().toLowerCase(), passwordHash]);
    req.session.user = { id: result.id, name: name.trim(), email: email.trim().toLowerCase() };
    res.status(201).json({ message: "Account created successfully.", user: req.session.user });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(409).json({ error: "An account with this email already exists." });
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get("SELECT * FROM users WHERE email = ?", [(email || "").trim().toLowerCase()]);
    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ message: "Login successful.", user: req.session.user });
  } catch { res.status(500).json({ error: "Could not log in." }); }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out successfully." }));
});

app.get("/api/me", (req, res) => res.json({ user: req.session.user || null }));

app.post("/api/orders", requireAuth, async (req, res) => {
  const { items, shippingName, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Your cart is empty." });
  if (!shippingName || !shippingAddress) return res.status(400).json({ error: "Shipping details are required." });

  try {
    let total = 0;
    const verifiedItems = [];
    for (const item of items) {
      const product = await get("SELECT * FROM products WHERE id = ?", [Number(item.productId)]);
      const quantity = Math.floor(Number(item.quantity));
      if (!product || !Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: "Invalid cart item." });
      if (quantity > product.stock) return res.status(400).json({ error: `${product.name} does not have enough stock.` });
      total += product.price * quantity;
      verifiedItems.push({ product, quantity });
    }

    await run("BEGIN TRANSACTION");
    const order = await run(
      "INSERT INTO orders (user_id, total, shipping_name, shipping_address) VALUES (?, ?, ?, ?)",
      [req.session.user.id, total, shippingName.trim(), shippingAddress.trim()]
    );
    for (const item of verifiedItems) {
      await run("INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        [order.id, item.product.id, item.product.name, item.product.price, item.quantity]);
      await run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product.id]);
    }
    await run("COMMIT");
    res.status(201).json({ message: "Order placed successfully!", orderId: order.id, total });
  } catch (err) {
    try { await run("ROLLBACK"); } catch {}
    console.error(err);
    res.status(500).json({ error: "Could not place your order. Please try again." });
  }
});

app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const orders = await all("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [req.session.user.id]);
    for (const order of orders) {
      order.items = await all("SELECT product_name, price, quantity FROM order_items WHERE order_id = ?", [order.id]);
    }
    res.json(orders);
  } catch { res.status(500).json({ error: "Could not load orders." }); }
});

initializeDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`MegaShop is running at http://localhost:${PORT}`));
}).catch(err => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
