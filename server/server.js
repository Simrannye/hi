const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();

require("dotenv").config();

const khaltiSecretKey = process.env.KHALTI_SECRET_KEY;
console.log("Khalti Secret Key:", khaltiSecretKey); 

console.log("Khalti Secret Key:", process.env.KHALTI_SECRET_KEY);




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

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or any other email service
  auth: {
    user: 'simrangurung655@gmail.com', // Your email address
    pass: 'glno rsiq hcxt luqj' // Your app password (not your regular password)
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's origin
  credentials: true // Allow cookies to be sent with requests
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
    
    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    
    // Insert new user (unverified)
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, verification_code, code_expiry, is_verified, created_at) VALUES (?, ?, ?, ?, ?, FALSE, NOW())',
      [username, email, hashedPassword, verificationCode, codeExpiry]
    );
    
    // Send verification email
    const mailOptions = {
      from: 'GrabNGo <simrangurung655@gmail.com>',
      to: email,
      subject: 'Verify Your Email - GrabNGo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center;">
            <h1 style="color: #4CAF50;">GrabNGo</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">Welcome to GrabNGo!</h2>
          <p style="font-size: 16px; color: #555; text-align: center;">
            Thank you for signing up with <strong>GrabNGo</strong>. To complete your registration, please verify your email address by entering the code below:
          </p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${verificationCode}
          </div>
    
          
          <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
            This code will expire in <strong>1 hour</strong>. If you did not sign up for GrabNGo, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777; text-align: center;">
            Need help? Contact us at <a href="mailto:support@grabngo.com" style="color: #4CAF50; text-decoration: none;">support@grabngo.com</a>
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Email verification endpoint
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    
    // Find user by ID
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if account is already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }
    
    // Check if verification code is correct and not expired
    if (user.verification_code !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    const now = new Date();
    const codeExpiry = new Date(user.code_expiry);
    
    if (now > codeExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired'
      });
    }
    
    // Mark user as verified
    await pool.query(
      'UPDATE users SET is_verified = TRUE, verification_code = NULL, code_expiry = NULL WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// Resend verification code endpoint
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if account is already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }
    
    // Generate new verification code
    const newVerificationCode = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    
    // Update user's verification code
    await pool.query(
      'UPDATE users SET verification_code = ?, code_expiry = ? WHERE id = ?',
      [newVerificationCode, codeExpiry, user.id]
    );
    
    // Send new verification email
    const mailOptions = {
      from: 'GrabNGo <simrangurung655@gmail.com>',
      to: email,
      subject: 'GrabNGo - New Verification Code',
      html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center;">
            <h1 style="color: #4CAF50;">GrabNGo</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">Welcome to GrabNGo!</h2>
          <p style="font-size: 16px; color: #555; text-align: center;">
            Thank you for signing up with <strong>GrabNGo</strong>. To complete your registration, please verify your email address by entering the code below:
          </p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${newVerificationCode}
          </div>
    
          
          <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
            This code will expire in <strong>1 hour</strong>. If you did not sign up for GrabNGo, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777; text-align: center;">
            Need help? Contact us at <a href="mailto:support@grabngo.com" style="color: #4CAF50; text-decoration: none;">support@grabngo.com</a>
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'New verification code sent',
      userId: user.id
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when resending verification code'
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
    
    // Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        userId: user.id,
        requiresVerification: true
      });
    }
    
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

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    const user = users[0];
    
    // Generate reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
    
    // Update user's verification code
    await pool.query(
      'UPDATE users SET verification_code = ?, code_expiry = ? WHERE id = ?',
      [resetCode, codeExpiry, user.id]
    );
    
    // Send password reset email
    const mailOptions = {
      from: 'GrabNGo <simrangurung655@gmail.com>',
      to: email,
      subject: 'Password Reset - GrabNGo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center;">
            <h1 style="color: #4CAF50;">GrabNGo</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #555; text-align: center;">
            You requested to reset your password for <strong>GrabNGo</strong>. Please use the verification code below:
          </p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
            This code will expire in <strong>30 minutes</strong>. If you did not request this password reset, please ignore this email or contact support.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777; text-align: center;">
            Need help? Contact us at <a href="mailto:support@grabngo.com" style="color: #4CAF50; text-decoration: none;">support@grabngo.com</a>
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Password reset code sent to your email',
      userId: user.id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// Verify reset code endpoint
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    
    // Validate input
    if (!userId || !verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and verification code are required' 
      });
    }
    
    // Find user by ID
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if verification code is correct and not expired
    if (user.verification_code !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    const now = new Date();
    const codeExpiry = new Date(user.code_expiry);
    
    if (now > codeExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired'
      });
    }
    
    res.json({
      success: true,
      message: 'Code verified successfully'
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during code verification'
    });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    // Validate input
    if (!userId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and new password are required' 
      });
    }
    
    // Find user by ID
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Check if user has a valid verification code (has gone through the reset process)
    if (!user.verification_code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset request'
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update user's password and clear verification code
    await pool.query(
      'UPDATE users SET password_hash = ?, verification_code = NULL, code_expiry = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// Resend reset code endpoint
app.post('/api/auth/resend-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    const user = users[0];
    
    // Generate new reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const codeExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
    
    // Update user's verification code
    await pool.query(
      'UPDATE users SET verification_code = ?, code_expiry = ? WHERE id = ?',
      [resetCode, codeExpiry, user.id]
    );
    
    // Send new reset code email
    const mailOptions = {
      from: 'GrabNGo <simrangurung655@gmail.com>',
      to: email,
      subject: 'New Password Reset Code - GrabNGo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center;">
            <h1 style="color: #4CAF50;">GrabNGo</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">New Password Reset Code</h2>
          <p style="font-size: 16px; color: #555; text-align: center;">
            You requested a new code to reset your password for <strong>GrabNGo</strong>. Please use the verification code below:
          </p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
            This code will expire in <strong>30 minutes</strong>. If you did not request this password reset, please ignore this email or contact support.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777; text-align: center;">
            Need help? Contact us at <a href="mailto:support@grabngo.com" style="color: #4CAF50; text-decoration: none;">support@grabngo.com</a>
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'New password reset code sent to your email',
      userId: user.id
    });
  } catch (error) {
    console.error('Resend reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when resending reset code'
    });
  }
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
      status: "Pending" 
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
app.post("/initiate-khalti-payment", async (req, res) => {
  console.log("0000000000000000000000000000000")
  const payload = {
      return_url: "http://localhost:3000/payment-sucess",
      website_url: "http://localhost:3000",
      amount: 1300,
      purchase_order_id: "test12",
      purchase_order_name: "test",
      customer_info: {
          name: "Khalti Bahadur",
          email: "example@gmail.com",
          phone: "9800000123"
      },
      amount_breakdown: [
          { label: "Mark Price", amount: 1000 },
          { label: "VAT", amount: 300 }
      ],
      product_details: [
          {
              identity: "1234567890",
              name: "Khalti logo",
              total_price: 1300,
              quantity: 1,
              unit_price: 1300
          }
      ],
      merchant_username: "merchant_name",
      merchant_extra: "merchant_extra"
  };
  console.log("66666666666666666666666666666666")
  try {
      const response = await axios.post(
          "https://dev.khalti.com/api/v2/epayment/initiate/",
          payload,
          {
              headers: {
                  Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                  "Content-Type": "application/json"
              }
          }
      );

      res.json(response.data);
  } catch (error) {
      console.error("Khalti API Error:", error.response?.data || error.message);
      res.status(400).json({ success: false, error: error.response?.data || "Unknown error" });
  }
});

app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
  }); 