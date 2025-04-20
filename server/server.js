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
const axios = require('axios');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import your Khalti payment utility functions
const { initiatePayment, validatePaymentSuccess } = require('./utils/KhaltiPayment');

// Middleware to parse JSON bodies
app.use(express.json());


// Set up upload folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});


const upload = multer({ storage });
app.use('/uploads', express.static('uploads')); // Serve static images

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
        email: req.session.user.email,
        role: req.session.user.role
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
      email: user.email,
      role: user.role
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
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


//UPDATING PROFILE
app.put('/api/auth/update-profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.session.user.id;
    const { username, email, phone, address } = req.body;

    await pool.query(
      "UPDATE users SET username = ?, email = ?, phone = ?, address = ? WHERE id = ?",
      [username, email, phone || '', address || '', userId]
    );

    // Update session info
    req.session.user.username = username;
    req.session.user.email = email;

    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// adding products

app.post("/api/products", upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, description, instock, location } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate inputs
    if (!name || !price || !category || !description || instock === null || !location) {
      return res.status(400).json({ message: "All fields are required including location" });
    }

    // Insert product with location
    const [result] = await pool.query(
      "INSERT INTO products (name, price, category, description, instock, image, location) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, price, category, description, instock, imagePath, location]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      price,
      category,
      description,
      instock,
      location,
      image: imagePath,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const { location } = req.query;
    let query = "SELECT * FROM products";
    const params = [];

    if (location) {
      query += " WHERE location = ?";
      params.push(location);
    }

    const [products] = await pool.query(query, params);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
});




// Update Product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  const { name, price, category, description, instock, oldImage } = req.body;
  const { id } = req.params;

  try {
    let imagePath = oldImage;

    // If new image uploaded, update path and delete old file
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;

      //  Delete old image file if it exists
      if (oldImage && fs.existsSync(path.join(__dirname, oldImage))) {
        fs.unlinkSync(path.join(__dirname, oldImage));
      }
    }

    await pool.query(
      "UPDATE products SET name = ?, price = ?, category = ?, description = ?, instock = ?, image = ? WHERE id = ?",
      [name, price, category, description, instock, imagePath, id]
    );

    res.json({ success: true, message: "Product updated" });
  } catch (err) {
    console.error("❌ Error updating product:", err);
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


// Save or update cart item
app.post('/api/cart', isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.session.user.id;

  if (!product_id || quantity == null) {
    return res.status(400).json({ success: false, message: 'Missing product or quantity' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(500).json({ message: "Failed to save cart" });
  }
});



// Get saved cart items for logged-in user
app.get('/api/cart', isAuthenticated, async (req, res) => {
  const user_id = req.session.user.id;
  try {
    const [cartItems] = await pool.query(`
      SELECT c.product_id AS id, p.name, p.price, c.quantity
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [user_id]);

    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});



app.delete('/api/cart/clear', isAuthenticated, async (req, res) => {
  const user_id = req.session.user.id;
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const { customer, page = 1, limit = 10, start, end } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = `
      SELECT 
        orders.*, 
        riders.name AS rider_name 
      FROM orders 
      LEFT JOIN riders ON orders.assigned_rider = riders.id 
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM orders 
      LEFT JOIN riders ON orders.assigned_rider = riders.id 
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    if (customer) {
      baseQuery += " AND orders.customer = ?";
      countQuery += " AND orders.customer = ?";
      params.push(customer);
      countParams.push(customer);
    }

    if (start) {
      baseQuery += " AND orders.created_at >= ?";
      countQuery += " AND orders.created_at >= ?";
      params.push(start);
      countParams.push(start);
    }

    if (end) {
      baseQuery += " AND orders.created_at <= ?";
      countQuery += " AND orders.created_at <= ?";
      params.push(end);
      countParams.push(end);
    }

    baseQuery += " ORDER BY orders.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [orders] = await pool.query(baseQuery, params);
    const [[countResult]] = await pool.query(countQuery, countParams);

    res.json({
      data: orders,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching filtered orders with rider name:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Add a new order
app.post('/api/orders', async (req, res) => {
  const { customer, items, totalAmount, paymentMethod, orderDate } = req.body;

  if (!customer || !items || items.length === 0 || !paymentMethod) {
    return res.status(400).json({ message: 'Missing order details' });
  }

  try {
    const productNames = items.map(item => `${item.name} x ${item.quantity}`).join(', ');
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    //  Convert ISO date to MySQL DATETIME format
    const formattedDate = new Date(orderDate || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    await pool.query(
      'INSERT INTO orders (customer, product_name, quantity, payment, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [customer, productNames, totalQty, paymentMethod, 'Pending', formattedDate]
    );

    res.json({ success: true, message: 'Order saved' });
  } catch (err) {
    console.error(' Error saving order to DB:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

    // Get the order
    const [[order]] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only decrease stock if marking as Completed AND wasn't already completed
    if (status === "Completed" && order.status !== "Completed") {
      const items = order.product_name.split(','); // e.g., "Apple x 2, Banana x 1"
      for (let item of items) {
        const [name, qty] = item.split('x').map(s => s.trim());
        const quantity = parseInt(qty);
        if (!isNaN(quantity)) {
          await pool.query(
            "UPDATE products SET instock = GREATEST(instock - ?, 0) WHERE name = ?",
            [quantity, name]
          );
        }
      }
    }

    // Update the order status
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    res.json({ message: "Order status updated and stock adjusted if needed" });
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







app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    await pool.query(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone, message]
    );

    res.json({ success: true, message: 'Message submitted successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Get all riders
app.get("/api/riders", async (req, res) => {
  try {
    const [riders] = await pool.query("SELECT * FROM riders");
    res.json(riders);
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new rider
app.post("/api/riders", async (req, res) => {
  try {
    const { name, address, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Name, phone, and password are required" });
    }

    const [existingRiders] = await pool.query("SELECT * FROM riders WHERE phone = ?", [phone]);
    if (existingRiders.length > 0) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO riders (name, address, phone, password) VALUES (?, ?, ?, ?)",
      [name, address || '', phone, hashedPassword]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      address,
      phone
    });
  } catch (error) {
    console.error("Error adding rider:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a rider
app.put("/api/riders/:id", async (req, res) => {
  try {
    const { name, address, phone, password } = req.body;
    const riderId = req.params.id;

    const [riders] = await pool.query("SELECT * FROM riders WHERE id = ?", [riderId]);
    if (riders.length === 0) return res.status(404).json({ message: "Rider not found" });

    const rider = riders[0];
    const updatedName = name || rider.name;
    const updatedAddress = address !== undefined ? address : rider.address;
    const updatedPhone = phone || rider.phone;

    if (phone && phone !== rider.phone) {
      const [existing] = await pool.query("SELECT * FROM riders WHERE phone = ? AND id != ?", [phone, riderId]);
      if (existing.length > 0) return res.status(409).json({ message: "Phone already registered" });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query("UPDATE riders SET name = ?, address = ?, phone = ?, password = ? WHERE id = ?",
        [updatedName, updatedAddress, updatedPhone, hashedPassword, riderId]);
    } else {
      await pool.query("UPDATE riders SET name = ?, address = ?, phone = ? WHERE id = ?",
        [updatedName, updatedAddress, updatedPhone, riderId]);
    }

    res.json({ message: "Rider updated", rider: { id: riderId, name: updatedName, address: updatedAddress, phone: updatedPhone } });
  } catch (error) {
    console.error("Error updating rider:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a rider
app.delete("/api/riders/:id", async (req, res) => {
  try {
    const riderId = req.params.id;
    const [riders] = await pool.query("SELECT * FROM riders WHERE id = ?", [riderId]);
    if (riders.length === 0) return res.status(404).json({ message: "Rider not found" });

    await pool.query("DELETE FROM riders WHERE id = ?", [riderId]);
    res.json({ message: "Rider deleted successfully" });
  } catch (error) {
    console.error("Error deleting rider:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/riders/assign-order", async (req, res) => {
  try {
    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
      return res.status(400).json({ message: "Order ID and Rider ID are required" });
    }

    // Check if order exists
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if rider exists
    const [riders] = await pool.query("SELECT * FROM riders WHERE id = ?", [riderId]);
    if (riders.length === 0) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Assign the order
    await pool.query(
      "UPDATE orders SET assigned_rider = ?, status = 'Assigned' WHERE id = ?",
      [riderId, orderId]
    );

    res.json({ message: "Order assigned to rider successfully" });
  } catch (error) {
    console.error("Error assigning order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Route to initiate payment
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { userId, amount, purchaseOrderName, returnUrl, websiteUrl } = req.body;
    const paymentResponse = await initiatePayment({
      userId,
      amount,
      purchaseOrderName,
      returnUrl,
      websiteUrl
    });
    res.status(200).json(paymentResponse); // Return payment URL and PIDX
  } catch (error) {
    console.error("Payment initiation failed:", error);
    res.status(500).json({ message: "Payment initiation failed", error: error.message });
  }
});

// Route to validate payment success
app.post('/api/payments/validate', async (req, res) => {
  try {
    const { pidx } = req.body; // Payment ID (pidx) to validate
    const validationResult = await validatePaymentSuccess(pidx);
    res.status(200).json(validationResult); // Return success status and details
  } catch (error) {
    console.error("Payment validation failed:", error);
    res.status(500).json({ message: "Payment validation failed", error: error.message });
  }
});


app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
  }); 



  