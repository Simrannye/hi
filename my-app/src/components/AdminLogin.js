import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Adminlogin.css';

const AdminLogin = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);
      if (data.user.role !== 'admin') throw new Error('Access denied. Not an admin.');

      navigate('/AdminPannel');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-content admin-shadow">
        <div className="admin-badge">Admin Portal</div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-brand-wrapper">
            <div className="admin-brand-logo">ADMIN DASHBOARD</div>
          </div>
          
          <h1 className="admin-title">Secure Login</h1>
          
          {error && (
            <div className="admin-alert admin-alert-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
          
          <input
            className="admin-input"
            type="email"
            name="email"
            placeholder="Admin Email"
            value={loginData.email}
            onChange={handleChange}
            required
          />
          
          <input
            className="admin-input"
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleChange}
            required
          />
          
          <button className="admin-button" type="submit">Sign In</button>
          
          <div className="admin-secure-notice">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secure Connection
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;