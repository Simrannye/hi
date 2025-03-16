import React from 'react';
import './AdminNavbar.css';

const AdminNavbar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="admin-navbar">
      <div className="admin-logo">
        <span className="logo-text">Admin Dashboard</span>
      </div>
      <nav className="admin-nav">
        <ul>
          <li 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="nav-icon dashboard-icon"></i>
            Dashboard
          </li>
          <li 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            <i className="nav-icon products-icon"></i>
            Products
          </li>
          <li 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            <i className="nav-icon orders-icon"></i>
            Orders
          </li>
        </ul>
      </nav>
      <div className="admin-user">
        <div className="user-avatar"></div>
        <span className="user-name">Admin</span>
      </div>
    </div>
  );
};

export default AdminNavbar;