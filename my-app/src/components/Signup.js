import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sign.css"; // Make sure the CSS file exists

const Signup = () => {
  // State management for form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setError("");
    alert("Signup Successful! 🚀"); // Replace with API call later
  };

  return (
    <div className="signup-container">
      {/* Header */}
      <header>
        <Link to="/" className="back-btn">← Back</Link>
        <h1 className="header-title">Create an Account</h1>
      </header>

      {/* Signup Form */}
      <main>
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" placeholder="Enter your full name" required value={formData.name} onChange={handleChange} />

          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required value={formData.email} onChange={handleChange} />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Create a password" required value={formData.password} onChange={handleChange} />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required value={formData.confirmPassword} onChange={handleChange} />

          <button type="submit" className="signup-btn">Sign Up</button>
        </form>

        <p className="login-link">Already have an account? <Link to="/login">Login here</Link></p>
      </main>

      {/* Footer */}
      <footer>
        <p>&copy; 2025 GrabnGo. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup;
