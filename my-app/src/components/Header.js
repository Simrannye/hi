import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import logo from "../grabb.png";
import "./Header.css";
import { useCart } from './CartContext';
import axios from 'axios';

const Header = ({ setSearchQuery, isCartOpen, setIsCartOpen, cart, setCart }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const searchRef = useRef(null);
  const { cartItems, getCartCount } = useCart();
  
  // Add notification state
  const [notification, setNotification] = useState("");
  // Internal cart state in case setCart isn't provided as a prop
  const [internalCart, setInternalCart] = useState([]);

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

  // Fetch cart if user is authenticated
  useEffect(() => {
    const fetchCartIfAuthenticated = async () => {
      try {
        const authRes = await axios.get('http://localhost:5000/api/auth/status', {
          withCredentials: true
        });

        if (authRes.data.authenticated) {
          const cartRes = await axios.get('http://localhost:5000/api/cart', {
            withCredentials: true
          });
          
          // Check if setCart is a function before calling it
          if (typeof setCart === 'function') {
            setCart(cartRes.data);
          } else {
            // Use internal state if setCart is not provided
            setInternalCart(cartRes.data);
          }
        }
      } catch (err) {
        console.error("Error checking auth or loading cart:", err);
      }
    };

    fetchCartIfAuthenticated();
  }, [user, setCart]);

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

  // Add notification handler with console log for debugging
  const showNotification = (message) => {
    console.log("Showing notification:", message);
    setNotification(message);
    
    // Clear notification after delay
    setTimeout(() => {
      setNotification("");
      console.log("Notification cleared");
    }, 3000);
  };

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
    if (typeof setSearchQuery === 'function') {
      setSearchQuery(productName);
    }
    
    // Navigate to products page with search parameter in URL
    navigate(`/products?search=${encodeURIComponent(productName)}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() !== '') {
      // Set the search query if the function is available
      if (typeof setSearchQuery === 'function') {
        setSearchQuery(searchInput);
      }
      setShowSuggestions(false);
      
      // Navigate to products page with search parameter in URL
      navigate(`/products?search=${encodeURIComponent(searchInput)}`);
    }
  };

  const getTotalCartItems = () => {
    // Use the provided cart prop or fall back to internal cart state
    const cartToUse = cart || internalCart;
    if (!cartToUse || cartToUse.length === 0) return 0;
    return cartToUse.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const handleCartClick = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    
    // If setIsCartOpen prop exists, use it
    if (typeof setIsCartOpen === 'function') {
      setIsCartOpen(true);
    } else {
      // Otherwise navigate to products page and set cart open flag
      navigate('/products', { state: { openCart: true } });
    }
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
          <a href="#cart" title="Shopping Cart" onClick={handleCartClick} className="cart-icon-header">
            <i className="fas fa-shopping-cart"></i>
            {getCartCount() > 0 && (
              <span className="cart-badge">{getCartCount()}</span>
            )}
          </a>

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
      
      {/* Notification display */}
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </>
  );
};

export default Header;