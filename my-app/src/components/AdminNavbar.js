import { useNavigate } from 'react-router-dom';
import { FaBox, FaClipboardList, FaChartBar } from 'react-icons/fa';
import './AdminNavbar.css';
import React, { useState, useEffect } from "react";



const AdminNavbar = ({ activeTab, setActiveTab, setUser }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  console.log("Is setUser a function?", typeof setUser); // should be 'function'

  const handleLogout = async () => {
    setIsLoggingOut(true); // Show spinner or disable UI
  
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
  
      if (response.ok) {
        setUser(null);
        navigate('/userauth', { replace: true });
      } else {
        console.error('Logout failed');
        alert('Something went wrong. Try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout error. Please try again.');
    } finally {
      setIsLoggingOut(false); // Reset UI
    }
  };
  
  

  return (
    <aside className="sidebar">
      <div className="admin-logo">
        <span className="logo-text">Admin Dashboard</span>
      </div>
      <nav className="admin-nav">
        <ul className="sidebar-menu">
          <li
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartBar className="nav-icon" /> Dashboard
          </li>
          <li
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            <FaBox className="nav-icon" /> Products
          </li>
          <li
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            <FaClipboardList className="nav-icon" /> Orders
          </li>

          <li
            className={activeTab === 'contact_messages' ? 'active' : ''}
            onClick={() => setActiveTab('contact_messages')}
          >
            <FaClipboardList className="nav-icon" /> Messages
          </li>

          <li
            className={activeTab === 'riders' ? 'active' : ''}
            onClick={() => setActiveTab('riders')}
          >
            <FaClipboardList className="nav-icon" /> Riders
          </li>

          <li onClick={!isLoggingOut ? handleLogout : null} style={{ opacity: isLoggingOut ? 0.5 : 1, cursor: 'pointer' }}>
          <FaClipboardList className="nav-icon" /> 
          {isLoggingOut ? "Logging out..." : "LogOut"}
          </li>

        </ul>
      </nav>
      <div className="admin-user">
        <div className="user-avatar"></div>
        <span className="user-name">Admin</span>
      </div>
    </aside>
  );
};

export default AdminNavbar;
