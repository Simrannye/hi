import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../grabb.png";
import "./Header.css";
import axios from 'axios';

const Header = ({ setSearchQuery }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const searchRef = useRef(null);

  // Fetch products for search suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching products for search:', err);
      }
    };
    
    fetchProducts();
  }, []);

  // Filter suggestions based on search input
  useEffect(() => {
    if (searchInput.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchInput.toLowerCase())
    );
    
    setSuggestions(filteredProducts);
  }, [searchInput, products]);

  // Handle clicks outside the search component to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Check authentication status when component mounts
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/status', {
          credentials: 'include'
        });

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (productName) => {
    setSearchInput(productName);
    setShowSuggestions(false);
    
    // Set the search query for the Products component
    if (setSearchQuery) {
      setSearchQuery(productName);
    }
    
    // Navigate to products page if not already there
    navigate('/products');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() !== '') {
      if (setSearchQuery) {
        setSearchQuery(searchInput);
      }
      setShowSuggestions(false);
      navigate('/products');
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <>
      <header className="App-header">
        <img src={logo} className="logo" alt="GrabnGo Logo" />

        <nav className="navbar">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/orders">Orders History</Link>
        </nav>

        <div className="search-container" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-form">
  <input 
    type="text" 
    placeholder="Search products..." 
    value={searchInput}
    onChange={handleSearchChange}
    onFocus={() => setShowSuggestions(true)}
  />
  <button type="submit">
    <i className="fas fa-search"></i>
  </button>
</form>
          
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-suggestions">
              {suggestions.map((product) => (
                <li 
                  key={product.id} 
                  onClick={() => handleSuggestionClick(product.name)}
                >
                  {product.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="icons">
          <a href="#sidebarhome" title="User Profile" onClick={toggleSidebar}>
            <i className="fa-solid fa-user"></i>
          </a>
        </div>
      </header>

      {/* Sidebar Component */}
      <div className={`sidebarhome ${isSidebarOpen ? "active" : ""}`} id="sidebarhome">
        <span className="username">{user ? user.username : "Guest"}</span> 
        <div className="profile-wrapper">
          {user && user.username ? (
            <div className="initials-avatar">
              {getInitials(user.username)}
            </div>
          ) : (
            <div className="initials-avatar">G</div>  
          )}
        </div>

        <ul>
          <li><Link to="/UserSetting">Settings</Link></li>
          <li><a href="#" onClick={toggleSidebar}>Back</a></li>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </ul>
      </div>
    </>
  );
};

export default Header;