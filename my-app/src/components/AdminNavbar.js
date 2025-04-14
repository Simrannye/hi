import React from 'react';
import { FaBox, FaClipboardList, FaChartBar } from 'react-icons/fa';
import './AdminNavbar.css';

const AdminNavbar = ({ activeTab, setActiveTab }) => {
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
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('')}
          >
            <FaClipboardList className="nav-icon" /> LogOut
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