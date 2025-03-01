import React, {useState} from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../grab.png";
import prologo from "./profile.jpg";
import "./Header.css";
import { useNavigate } from 'react-router-dom';




const Header = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
  
    const toggleSidebar = () => {
      setSidebarOpen(!isSidebarOpen);
    };
  
    const handleLogout = async () => {
      try {
          const response = await fetch('http://localhost:5000/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
          });

          if (response.ok) {
              setUser(null);
              navigate('/userauth'); // Redirect to login page after logout
          } else {
              console.error('Logout failed');
          }
      } catch (error) {
          console.error('Logout error:', error);
      }
  };
    return (
      <>
        <header className="App-header">
          <img src={logo} className="logo" alt="GrabnGo Logo" />
  
          <nav className="navbar">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/offers">Offers</Link>
            <Link to="/contact">Contact</Link>
          </nav>
  
          <form action="/search" className="search-form">
            <input type="text" placeholder="Search.." name="search" />
            <button type="searchsubmit">&#10162;</button>
          </form>
  
          <div className="icons">
            <Link to="/cart" title="Cart">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="notification">3</span>
            </Link>
  
            {/* Sidebar Toggle Button */}
            <a href="#sidebar" title="User Profile" onClick={toggleSidebar}>
              <i className="fa-solid fa-user"></i>
            </a>
          </div>
        </header>
  
        {/* Sidebar Component */}
        <div className={`sidebar ${isSidebarOpen ? "active" : ""}`} id="sidebar">
          <h4>Username</h4>
          <div className="profile-wrapper">
            <div className="profile-container">
            <img src={prologo} className="prologo" alt="pro Logo" />
            </div>
          </div>
          <ul>
            <li><Link to="/UserSetting">Settings</Link></li>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <li><a href="#" onClick={toggleSidebar}>Back</a></li>
          </ul>
        </div>
      </>
    );
  };
  

  export default Header;