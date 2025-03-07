const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const app = express();



// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'grabngo'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Session store options
const sessionStore = new MySQLStore({
  checkExpirationInterval: 900000, // How frequently to check for expired sessions (15 mins)
  expiration: 86400000, // Session expiration (24 hours)
  createDatabaseTable: true // Create sessions table if it doesn't exist
}, pool);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's origin
  credentials: true // Allow cookies & authentication headers
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret', // Use a strong secret in production
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
  }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  console.log('Session User:', req.session.user);
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ 
      authenticated: false, 
      message: "You need to log in to access this resource" 
    });
  }
};

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true, 
      user: { 
        id: req.session.user.id, 
        username: req.session.user.username, 
        email: req.session.user.email 
      } 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Check if username already exists
    const [existingUsernames] = await pool.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );
    
    if (existingUsernames.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, hashedPassword]
    );
    
    // Create session for the new user
    req.session.user = {
      id: result.insertId,
      username,
      email
    };
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    const user = users[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Create session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to logout' 
      });
    }
    
    res.clearCookie('session_cookie_name');
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

// Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await pool.query("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a New Product
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, category, description, instock } = req.body;

    if (!name || !price || !category || !description || instock === null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO products (name, price, category, description, instock) VALUES (?, ?, ?, ?, ?)",
      [name, price, category, description, instock]
    );
    

    res.status(201).json({ id: result.insertId, name, price, category, description, instock });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Product
app.put("/api/products/:id", async (req, res) => {
  try {
    const { name, price, category, description, instock } = req.body;
    const { id } = req.params;

    if (!name || !price || !category || !description || instock === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      "UPDATE products SET name = ?, price = ?, category = ?, description = ?, instock = ? WHERE id = ?",
      [name, price, category, description, instock, id]
    );
    

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

  res.json({ id, name, price, category, description, instock });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new order
// Add a new order
app.post("/api/orders", async (req, res) => {
  try {
    const { customer, product_name, quantity } = req.body;

    if (!customer || !product_name || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Updated query with default 'Pending' status
    const [result] = await pool.query(
      "INSERT INTO orders (customer, product_name, quantity, status) VALUES (?, ?, ?, 'Pending')",
      [customer, product_name, quantity]
    );

    res.status(201).json({ 
      id: result.insertId, 
      customer, 
      product_name, 
      quantity, 
      status: "Pending" // Ensure status is included in response
    });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Update order status (Pending → Completed)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Order status is required" });
    }

    const [result] = await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an order
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM orders WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// KHALTI API

app.post("/verify-khalti-payment", async (req, res) => {
  const { token, amount } = req.body;

  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { token, amount },
      {
        headers: {
          Authorization: "test_secret_key_869603e9e63a4183ac710ac4d7eb614f", // Replace with your Khalti Secret Key
        },
      }
    );

    if (response.data.state.name === "Completed") {
      return res.json({ success: true, message: "Payment Verified!" });
    } else {
      return res.json({ success: false, message: "Payment not completed!" });
    }
  } catch (error) {
    console.error("Khalti Error:", error.response?.data || error.message);
    return res.status(400).json({ success: false, error: error.response.data });
  }
});


app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
  }); 