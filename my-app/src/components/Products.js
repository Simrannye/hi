import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import "./Products.css";
import Header from "./Header";
import Footer from "./Footer";
import { useCart } from './CartContext';

const Products = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualOverride, setManualOverride] = useState(null);

  const { cartItems, addToCart, removeFromCart, getCartTotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle cart open state from location
  useEffect(() => {
    if (location.state && location.state.openCart) {
      setIsCartOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          

          const hubs = [
            { name: "Thamel", lat: 27.7149, lon: 85.3123 },
            { name: "Budhanilkantha", lat: 27.793, lon: 85.3635 },
            { name: "Naxal", lat: 27.7172, lon: 85.3266 },
          ];


          const getDistance = (lat1, lon1, lat2, lon2) => {
              const dLat = lat2 - lat1;
              const dLon = lon2 - lon1;
             return dLat * dLat + dLon * dLon; // no sqrt needed
             
};


          const nearest = hubs.reduce((prev, curr) => {
            const prevDist = getDistance(latitude, longitude, prev.lat, prev.lon);
            const currDist = getDistance(latitude, longitude, curr.lat, curr.lon);
            return currDist < prevDist ? curr : prev;
          });


              console.log(`📍 You are approximately at [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
    console.log(`🚚 Your nearest delivery hub is: ${nearest.name}`);

          if (!manualOverride) setUserLocation(nearest.name);
        },
        (error) => console.error("Geolocation error:", error)
      );
    }
  }, [manualOverride]);

  // Fetch products when user location is determined
  useEffect(() => {
    if (!userLocation) return;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = userLocation === "all"
          ? "http://localhost:5000/api/products"
          : `http://localhost:5000/api/products?location=${userLocation}`;
        const res = await axios.get(url);
        setProducts(res.data.map(p => ({ ...p, quantity: 0, inStock: p.instock > 0 })));
        setLoading(false);
      } catch (err) {
        setError("Failed to load products. Please try again later.");
        setLoading(false);
      }
    };
    fetchProducts();
  }, [userLocation]);

  // Handle search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      // Scroll to top when search changes
      window.scrollTo(0, 0);
    }
  }, [location.search]);

  // Process search results and find exact matches
  useEffect(() => {
    if (searchQuery && products.length > 0) {
      const exactMatch = products.find(p => 
        p.name.toLowerCase() === searchQuery.toLowerCase()
      );
      
      if (exactMatch) {
        // Set the selected product and open modal
        console.log("Found exact match for search:", exactMatch.name);
        setSelectedProduct(exactMatch);
        setShowModal(true);
      }
      
      // Filter products that match the search query
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setFilteredProducts(matches);
    } else {
      // If no search query, filter by category
      setFilteredProducts(activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory));
    }
  }, [searchQuery, products]);

  // Update filtered products when category changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory));
    }
  }, [activeCategory, products, searchQuery]);

  const increaseQuantity = (id) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, quantity: Math.min(p.quantity + 1, p.instock) } : p
    ));
    if (selectedProduct?.id === id) {
      setSelectedProduct(prev => ({ ...prev, quantity: Math.min(prev.quantity + 1, prev.instock) }));
    }
  };

  const decreaseQuantity = (id) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, quantity: Math.max(p.quantity - 1, 0) } : p
    ));
    if (selectedProduct?.id === id) {
      setSelectedProduct(prev => ({ ...prev, quantity: Math.max(prev.quantity - 1, 0) }));
    }
  };

  const handleAddToCartModal = () => {
    if (!selectedProduct || selectedProduct.quantity === 0) {
      showNotification("Please select a quantity");
      return;
    }
    addToCart(selectedProduct, selectedProduct.quantity);
    showNotification(`Added ${selectedProduct.name} to cart!`);
    setSelectedProduct(prev => ({ ...prev, quantity: 0 }));
    setShowModal(false);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 800);
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/products'); // Remove search query from URL
  };
  
  const categories = ['all', ...new Set(products.map(p => p.category))];

  // Handle explicit search query setting (for Header component)
  const handleSetSearchQuery = (query) => {
    setSearchQuery(query);
    
    // Find exact match in products
    if (products.length > 0) {
      const exactMatch = products.find(p => p.name.toLowerCase() === query.toLowerCase());
      if (exactMatch) {
        setSelectedProduct(exactMatch);
        setShowModal(true);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header 
          setSearchQuery={handleSetSearchQuery} 
          isCartOpen={isCartOpen} 
          setIsCartOpen={setIsCartOpen} 
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header 
          setSearchQuery={handleSetSearchQuery}
          isCartOpen={isCartOpen} 
          setIsCartOpen={setIsCartOpen} 
        />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        setSearchQuery={handleSetSearchQuery}
        isCartOpen={isCartOpen} 
        setIsCartOpen={setIsCartOpen} 
      />
      <div className="container">
        {searchQuery && (
          <div className="search-results-header">
            <h2>Search Results for: "{searchQuery}"</h2>
            <button className="clear-search-btn" onClick={clearSearch}>Clear Search</button>
          </div>
        )}

        <div className="location-selector">
          <p className="location-text">Showing near location products: <strong>{userLocation}</strong></p>
          <select
            className="location-dropdown"
            value={userLocation}
            onChange={(e) => {
              setManualOverride(true);
              setUserLocation(e.target.value);
            }}>
            <option value="Thamel">Thamel</option>
            <option value="Budhanilkantha">Budhanilkantha</option>
            <option value="Naxal">Naxal</option>
          </select>
        </div>

        <div className="filter-section">
          {categories.map(category => (
            <button key={category} className={`filter-btn ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <p className="no-products">{searchQuery ? `No products found matching "${searchQuery}"` : "No products found in this category"}</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}>
                <img src={product.image} alt={product.name} className="product-image clickable" onClick={() => { setSelectedProduct(product); setShowModal(true); }} />
                <h3 className="product-name clickable" onClick={() => { setSelectedProduct(product); setShowModal(true); }}>{product.name}</h3>
                <p className="product-price">NPR {Number(product.price).toFixed(2)}</p>
                <p className="product-description">{product.description}</p>
                {!product.inStock ? (<span className="out-of-stock-label">Out of Stock</span>) : (
                  <>
                    <div className="quantity-controls">
                      <button className="quantity-btn decrease" onClick={() => decreaseQuantity(product.id)}>-</button>
                      <span className="quantity">{product.quantity}</span>
                      <button className="quantity-btn increase" onClick={() => increaseQuantity(product.id)} disabled={product.quantity >= product.instock}>+</button>
                    </div>
                    {product.quantity >= product.instock && <p className="stock-warning">Only {product.instock} available in stock</p>}
                    <button
                      className="add-to-cart-btn"
                      onClick={() => {
                        if (product.quantity > 0) {
                          addToCart(product, product.quantity);
                          showNotification(`Added ${product.name} to cart!`);

                          // Reset quantity after adding
                          setProducts(prevProducts =>
                            prevProducts.map(p =>
                              p.id === product.id ? { ...p, quantity: 0 } : p
                            )
                          );
                        } else {
                          showNotification("Please select quantity");
                        }
                      }}
                    >
                      Add to Cart
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`cart-container ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="cart-close" onClick={() => setIsCartOpen(false)}>&times;</button>
        </div>
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name} x {item.quantity}</span>
                <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
                <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>✕</button>
              </div>
            ))
          )}
        </div>
        <div className="cart-subtotal">
          <span className="subtotal-label">Total Amount:</span>
          <span className="subtotal-value">NPR {getCartTotal()}</span>
        </div>
        <div className="checkout-button-container">
          <button className="checkout-button" onClick={() => navigate("/Checkout", { state: { totalAmount: getCartTotal() } })} disabled={cartItems.length === 0}>
            Checkout Now
          </button>
        </div>
      </div>

      {notification && <div className="notification visible">{notification}</div>}

      {showModal && selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-image" />
            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description}</p>
            <p><strong>NPR {Number(selectedProduct.price).toFixed(2)}</strong></p>
            <p>Stock: {selectedProduct.instock}</p>
            <div className="quantity-controls modal-quantity">
              <button className="quantity-btn decrease" onClick={() => setSelectedProduct(prev => ({ ...prev, quantity: Math.max((prev.quantity || 0) - 1, 0) }))}>–</button>
              <span className="quantity">{selectedProduct.quantity || 0}</span>
              <button className="quantity-btn increase" onClick={() => setSelectedProduct(prev => (prev.quantity || 0) < prev.instock ? { ...prev, quantity: (prev.quantity || 0) + 1 } : prev)} disabled={selectedProduct.quantity >= selectedProduct.instock}>+</button>
            </div>
            {selectedProduct.quantity >= selectedProduct.instock && <p className="stock-warning">Only {selectedProduct.instock} available in stock</p>}
            <button className="add-to-cart-btn modal-add-btn" onClick={handleAddToCartModal} disabled={(selectedProduct.quantity || 0) === 0}>Add to Cart</button>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Products;