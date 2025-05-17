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
    secure: false// Use secure cookies in production
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
app.get('/api/auth/status', async (req, res) => {
  if (!req.session.user) {
    return res.json({ authenticated: false });
  }

  try {
    const userId = req.session.user.id;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.json({ authenticated: false });
    }

    const user = users[0];
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        address: user.address || ""
      }
    });
  } catch (error) {
    console.error("Error fetching user in auth/status:", error);
    res.status(500).json({ authenticated: false });
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

// Remove a single cart item
app.delete('/api/cart/:product_id', isAuthenticated, async (req, res) => {
  const user_id = req.session.user.id;
  const { product_id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Clear all cart items
console.log("✅ Registering DELETE /api/cart/clear route");

// Add a new, simpler endpoint for cart clearing
app.delete('/api/clear-cart', isAuthenticated, async (req, res) => {
  console.log("🧹 DELETE /api/clear-cart triggered");
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
  const { customer, items, totalAmount, paymentMethod, orderDate, pidx } = req.body;
  console.log("🚀 Order received on backend:", req.body);

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
      'INSERT INTO orders (customer, product_name, quantity, payment, status, created_at, payment_method, payment_reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customer, productNames, totalQty, paymentMethod, 'Pending', formattedDate, paymentMethod, pidx]
    );
    
    // ADDED: Clear the cart for this user if they're authenticated
    if (req.session.user && req.session.user.id) {
      console.log("🧹 Clearing cart for user:", req.session.user.id);
      await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.user.id]);
    }

    res.json({ success: true, message: 'Order saved' });
  } catch (err) {
    console.error('Error saving order to DB:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});





// app.put('/api/orders/:id/status', async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const { status, riderId } = req.body;

//     // ✅ Log the incoming request
//     console.log("🚚 Incoming update:", { orderId, status, riderId });

//     if (!status || !riderId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Status and rider ID are required'
//       });
//     }

//     const [orders] = await pool.query(
//       'SELECT * FROM orders WHERE id = ? AND assigned_rider = ?',
//       [orderId, riderId]
//     );

//     if (orders.length === 0) {
//       return res.status(403).json({
//         success: false,
//         message: 'Order not found or not assigned to this rider'
//       });
//     }

//     await pool.query(
//       'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? AND assigned_rider = ?',
//       [status, orderId, riderId]
//     );

//     if (status === 'Completed') {
//       await pool.query(
//         'UPDATE orders SET delivered_at = NOW() WHERE id = ?',
//         [orderId]
//       );
//     }

//     if (status === 'Picked Up') {
//       await pool.query(
//         'UPDATE orders SET picked_up_at = NOW() WHERE id = ?',
//         [orderId]
//       );
//     }

//     res.json({
//       success: true,
//       message: `Order status updated to ${status}`
//     });
//   } catch (error) {
//     // ✅ Log the full error in terminal for debugging
//     console.error("❌ Error updating order status:", error);

//     // ✅ Return a helpful error message to the frontend
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Server error'
//     });
//   }
// });




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
    const { pidx } = req.body;
    const result = await validatePaymentSuccess(pidx);

    // Find the order by pidx (stored as payment_reference)
    const [orders] = await pool.query('SELECT * FROM orders WHERE payment_reference = ?', [pidx]);
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found for pidx" });
    }

    const order = orders[0];

    // 1. Insert into payments table
    await pool.query(
      'INSERT INTO payments (order_id, pidx, transaction_id, amount, status, provider) VALUES (?, ?, ?, ?, ?, ?)',
      [order.id, pidx, result.transaction_id, result.amount, result.status, 'Khalti']
    );

    // 2. Update orders table to mark payment as verified
    await pool.query(
      'UPDATE orders SET payment_verified = 1 WHERE id = ?',
      [order.id]
    );

    res.status(200).json({ success: true, message: "Payment recorded and order updated." });
  } catch (error) {
    console.error("Payment validation failed:", error);
    res.status(500).json({ message: "Payment validation failed", error: error.message });
  }
});

// Add this to server.js if not already present
app.post('/api/khalti/verify', async (req, res) => {
  const { pidx } = req.body;
  if (!pidx) return res.status(400).json({ message: 'Missing pidx' });

  try {
    const response = await axios.post(
      'https://dev.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("🔴 Khalti verify error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});



// Rider login endpoint
// Rider login using ID instead of phone
app.post('/api/riders/login', async (req, res) => {
  try {
    const { id, password } = req.body;

    // Validate input
    if (!id || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rider ID and password are required' 
      });
    }

    // Find rider by ID
    const [riders] = await pool.query(
      'SELECT * FROM riders WHERE id = ?',
      [id]
    );

    if (riders.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID or password' 
      });
    }

    const rider = riders[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, rider.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID or password' 
      });
    }

    // Save session info
req.session.rider = {
  id: rider.id,
  name: rider.name,
  phone: rider.phone,
  address: rider.address
};


    // Return rider info
    res.json({
      success: true,
      message: 'Login successful',
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      address: rider.address
    });

  } catch (error) {
    console.error('Rider login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});


// Get specific rider information
app.get('/api/riders/:id', async (req, res) => {
  try {
    const riderId = req.params.id;
    
    const [riders] = await pool.query(
      'SELECT id, name, phone, address, created_at FROM riders WHERE id = ?',
      [riderId]
    );
    
    if (riders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }
    
    // Don't send back password hash
    const rider = riders[0];
    
    res.json(rider);
  } catch (error) {
    console.error('Get rider error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


app.get('/api/riders/status', (req, res) => {
  console.log("🟢 Rider session check triggered");
  if (req.session.rider) {
    res.json({ authenticated: true, rider: req.session.rider });
  } else {
    res.json({ authenticated: false });
  }
});



app.post('/api/riders/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie('session_cookie_name'); // your session cookie key
    res.json({ message: "Logout successful" });
  });
});



// Get orders for a specific rider
app.get('/api/riders/:id/orders', async (req, res) => {
  try {
    const riderId = req.params.id;
    const { status } = req.query;
    
    let query = `
SELECT 
  orders.*, 
  users.username AS customer_name, 
  users.phone AS customer_phone, 
  users.address AS customer_address
FROM orders
LEFT JOIN users ON orders.customer = users.username
WHERE orders.assigned_rider = ?


    `;
    const params = [riderId];
    
    // Filter by status if provided
    if (status) {
      query += " AND orders.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY orders.created_at DESC";
    
    const [orders] = await pool.query(query, params);
    
    // Format the response
    const formattedOrders = orders.map(order => {
      return {
        id: order.id,
        product_name: order.product_name,
        quantity: order.quantity,
        payment: order.payment,
        status: order.status,
        address: order.customer_address,
        phone: order.customer_phone,
        customer_name: order.customer_name,
        customer_id: order.customer,
        created_at: order.created_at
      };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Get rider orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update order status by rider
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, riderId } = req.body;
    
    if (!status || !riderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status and rider ID are required' 
      });
    }
    
    // Verify the order belongs to this rider
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND assigned_rider = ?',
      [orderId, riderId]
    );
    
    if (orders.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Order not found or not assigned to this rider' 
      });
    }
    
    // Valid status transitions
    const validStatuses = ['Assigned', 'Picked Up', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    // Update order status
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );
    
    // If marking as delivered/completed, record completion time
    if (status === 'Completed') {
      await pool.query(
        'UPDATE orders SET delivered_at = NOW() WHERE id = ?',
        [orderId]
      );
    }
    
    // If marking as picked up, record pickup time
    if (status === 'Picked Up') {
      await pool.query(
        'UPDATE orders SET picked_up_at = NOW() WHERE id = ?',
        [orderId]
      );
    }
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get rider stats/summary
app.get('/api/riders/:id/stats', async (req, res) => {
  try {
    const riderId = req.params.id;
    
    // Get stats for the rider
    const [result] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'Assigned' OR status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'Picked Up' THEN 1 ELSE 0 END) as in_transit_orders,
        SUM(CASE WHEN status = 'Completed' OR status = 'Delivered' THEN 1 ELSE 0 END) as completed_orders,
        DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as first_order_date
      FROM orders
      WHERE assigned_rider = ?
    `, [riderId]);
    
    // Find rider's most recent delivery
    const [latestDelivery] = await pool.query(`
      SELECT created_at
      FROM orders
      WHERE assigned_rider = ? AND (status = 'Completed' OR status = 'Delivered')
      ORDER BY created_at DESC
      LIMIT 1
    `, [riderId]);
    
    const stats = result[0];
    stats.latest_delivery = latestDelivery.length > 0 ? latestDelivery[0].created_at : null;
    
    res.json(stats);
  } catch (error) {
    console.error('Get rider stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Update rider profile
app.put('/api/riders/:id/profile', async (req, res) => {
  try {
    const riderId = req.params.id;
    const { name, phone, address, currentPassword, newPassword } = req.body;
    
    // Get current rider information
    const [riders] = await pool.query('SELECT * FROM riders WHERE id = ?', [riderId]);
    
    if (riders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rider not found' 
      });
    }
    
    const rider = riders[0];
    
    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required to set new password' 
        });
      }
      
      const passwordMatch = await bcrypt.compare(currentPassword, rider.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update rider with new password
      await pool.query(
        'UPDATE riders SET password = ?, name = ?, phone = ?, address = ? WHERE id = ?',
        [hashedPassword, name || rider.name, phone || rider.phone, address || rider.address, riderId]
      );
    } else {
      // Update rider without changing password
      await pool.query(
        'UPDATE riders SET name = ?, phone = ?, address = ? WHERE id = ?',
        [name || rider.name, phone || rider.phone, address || rider.address, riderId]
      );
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update rider profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});



//reccomendation

app.get('/api/recommendations/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Get user's most ordered category
    const [history] = await pool.query(`
      SELECT p.category, COUNT(*) as count
      FROM orders o
      JOIN products p ON o.product_name LIKE CONCAT('%', p.name, '%')
      WHERE o.customer = ?
      GROUP BY p.category
      ORDER BY count DESC
      LIMIT 1
    `, [username]);

    if (history.length === 0) {
      return res.json({ recommendations: [] });
    }

    const favoriteCategory = history[0].category;

    // Recommend products from that category
    const [recommendations] = await pool.query(`
      SELECT * FROM products 
      WHERE category = ? 
      ORDER BY RAND()
      LIMIT 5
    `, [favoriteCategory]);

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});




app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
  }); 



  