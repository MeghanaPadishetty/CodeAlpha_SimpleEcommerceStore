# MegaShop — Simple E-commerce Store

Internship Task 1 implementation using HTML, CSS, JavaScript, Node.js, Express and SQLite.

## Features
- Responsive home page and product listing
- Product search and category filtering
- Product details page
- Shopping cart with quantity controls
- User registration, login and logout
- Password hashing with bcrypt
- SQLite database for users, products, orders and order items
- Checkout and order history
- Server-side price and stock validation when placing orders

## Requirements
- Node.js 18 or later (Node.js 20 LTS recommended)
- npm

## Run locally
1. Extract the ZIP file.
2. Open the extracted `megashop-ecommerce` folder in VS Code.
3. Open Terminal > New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. (Recommended) Copy `.env.example` to `.env` and change `SESSION_SECRET` to a long random value.
   The project can run without this step for local practice.
6. Start the server:

   ```bash
   npm start
   ```

7. Open http://localhost:3000

For development with automatic restart:

```bash
npm run dev
```

## How to test the project
1. Open the home page and browse products.
2. Search for a product or choose a category.
3. Open a product and add it to the cart.
4. Open Cart and change quantities or remove items.
5. Choose Create account and register using your own test email.
6. Log in if needed.
7. Enter a shipping name and address and place an order.
8. Open My Orders to see the saved order.

## Database
On first run, the server creates `data/megashop.sqlite` and inserts sample products automatically. The database is local and should not be committed to Git.

## Project structure
```text
megashop-ecommerce/
├── data/                  # SQLite database and session database created at runtime
├── public/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── product.js
│   ├── index.html
│   ├── product.html
│   ├── cart.html
│   ├── login.html
│   ├── register.html
│   └── orders.html
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Important notes
- This is an internship learning/demo project, not a production payment system.
- Checkout records an order; it does not collect card details or process real payments.
- Before deploying publicly, configure a strong session secret, HTTPS, secure cookies, CSRF protection, rate limiting, validation, and production logging.
- Product images are loaded from Unsplash URLs, so an internet connection is needed to display those photos. The application itself runs locally.
