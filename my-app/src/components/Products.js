import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import "./Products.css";
import Header from "./Header";

const Products = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // product to show in popup
  const [showModal, setShowModal] = useState(false);  

  const navigate = useNavigate();

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/products');
        const productsWithQuantity = response.data.map(product => ({
          ...product,
          quantity: 0,
          inStock: product.instock > 0
        }));
        setProducts(productsWithQuantity);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };
  
    const fetchCartIfAuthenticated = async () => {
      try {
        const authRes = await axios.get('http://localhost:5000/api/auth/status', {
          withCredentials: true
        });
  
        if (authRes.data.authenticated) {
          const cartRes = await axios.get('http://localhost:5000/api/cart', {
            withCredentials: true
          });
          setCart(cartRes.data);
        }
      } catch (err) {
        console.error("Error checking auth or loading cart:", err);
      }
    };
  
    fetchProducts();
    fetchCartIfAuthenticated();
    
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === activeCategory));
    }
  }, [activeCategory, products]);

  // Handle quantity increase
  const increaseQuantity = (id) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity < product.instock
                ? product.quantity + 1
                : product.quantity // prevent exceeding
            }
          : product
      )
    );
  };
  

  // Handle quantity decrease
  const decreaseQuantity = (id) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === id && product.quantity > 0
          ? { ...product, quantity: product.quantity - 1 } 
          : product
      )
    );
  };

  const addToCart = async (id) => {
    const product = products.find(p => p.id === id);
  
    if (!product) return;
  
    // ⛔ Block if quantity is 0 or exceeds in-stock
    if (product.quantity === 0 || product.quantity > product.instock) {
      showNotification(`Only ${product.instock} available in stock`);
      return;
    }
  
    try {
      // Save to backend
      await axios.post('http://localhost:5000/api/cart', {
        product_id: product.id,
        quantity: product.quantity
      }, {
        withCredentials: true
      });
  
      // Update local cart
      setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(item => item.id === id);
        if (existingItemIndex >= 0) {
          const updatedCart = [...prevCart];
          updatedCart[existingItemIndex].quantity += product.quantity;
          return updatedCart;
        } else {
          return [...prevCart, {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity
          }];
        }
      });
  
      // Reset input quantity
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === id ? { ...p, quantity: 0 } : p
        )
      );
  
      showNotification(`Added ${product.name} to cart!`);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      showNotification("Error adding to cart.");
    }
  };
  
  

  // Remove item from cart
  const removeFromCart = (id) => {
    const product = products.find(p => p.id === id);
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    
    if (product) {
      showNotification(`Removed ${product.name} from cart!`);
    }
  };

  // Show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification('');
    }, 1000);
  };

  // Calculate cart total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  // Handle checkout
  const handleCheckout = () => {
    navigate("/Checkout", {
      state: { cart, totalAmount: calculateTotal() },
    });
  };

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category))];

  if (loading) {
    return (
      <>
        <Header />
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
        <Header />
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className="container">
        {/* Logo and Cart Icon */}
        <div className="shop-header">
          <div className="logo">Fresh Groceries</div>
          <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
            <i className="fas fa-shopping-cart"></i>
            <span className="cart-count">{cart.length}</span>
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="filter-section">
          {categories.map(category => (
            <button 
              key={category}
              className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <p className="no-products">No products found in this category</p>
          ) : (
            filteredProducts.map(product => (
              <div 
                key={product.id} 
                className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}
              >
                <img
  src={product.image}
  alt={product.name}
  className="product-image clickable"
  onClick={() => {
    setSelectedProduct(product);
    setShowModal(true);
  }}
/>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">NPR {Number(product.price).toFixed(2)}</p>
                <p className="product-description">{product.description}</p>
                
                {!product.inStock ? (
                  <span className="out-of-stock-label">Out of Stock</span>
                ) : (
                  <>
<div className="quantity-controls">
  <button 
    className="quantity-btn decrease" 
    onClick={() => decreaseQuantity(product.id)}
  >
    -
  </button>
  <span className="quantity">{product.quantity}</span>
  <button 
    className="quantity-btn increase" 
    onClick={() => increaseQuantity(product.id)}
    disabled={product.quantity >= product.instock}
    title={product.quantity >= product.instock ? 'Reached max available stock' : ''}
  >
    +
  </button>
</div>

{product.quantity >= product.instock && (
  <p className="stock-warning">Only {product.instock} available in stock</p>
)}

                    <button 
                      className="add-to-cart-btn" 
                      onClick={() => addToCart(product.id)}
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
      
      {/* Shopping Cart Sidebar */}
      <div className={`cart-container ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="cart-close" onClick={() => setIsCartOpen(false)}>
            &times;
          </button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name} x {item.quantity}</span>
                <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
                <button 
                  className="remove-item-btn" 
                  onClick={() => removeFromCart(item.id)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Cart Total Display Section */}
        <div className="cart-subtotal">
          <span className="subtotal-label">Total Amount:</span>
          <span className="subtotal-value">NPR {calculateTotal()}</span>
        </div>
        
        {/* Added Checkout Button */}
        <div className="checkout-button-container">
          <button 
            className="checkout-button" 
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Checkout Now
          </button>
        </div>
        
        <div className="cart-footer">
          <div className="cart-total-container">
            <span>Total:</span>
            <span>NPR {calculateTotal()}</span>
          </div>
          <Link to="/checkout" className="checkout-btn">
            Proceed to Checkout
          </Link>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className="notification visible">
          {notification}
        </div>
      )}
      {showModal && selectedProduct && (
  <div className="product-modal-overlay" onClick={() => setShowModal(false)}>
    <div
      className="product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
      <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-image" />
      <h2>{selectedProduct.name}</h2>
      <p>{selectedProduct.description}</p>
      <p><strong>NPR {Number(selectedProduct.price).toFixed(2)}</strong></p>
      <p>Stock: {selectedProduct.instock}</p>

      {/* Quantity Control */}
      <div className="quantity-controls">
        <button
          className="quantity-btn decrease"
          onClick={() =>
            setSelectedProduct(prev => ({
              ...prev,
              quantity: Math.max((prev.quantity || 0) - 1, 0)
            }))
          }
        >
          –
        </button>
        <span className="quantity">{selectedProduct.quantity || 0}</span>
        <button
          className="quantity-btn increase"
          onClick={() =>
            setSelectedProduct(prev =>
              (prev.quantity || 0) < prev.instock
                ? { ...prev, quantity: (prev.quantity || 0) + 1 }
                : prev
            )
          }
        >
          +
        </button>
      </div>

      {/* Add to Cart */}
      <button
        className="add-to-cart-btn"
        onClick={async () => {
          if ((selectedProduct.quantity || 0) === 0) return;

          try {
            await axios.post('http://localhost:5000/api/cart', {
              product_id: selectedProduct.id,
              quantity: selectedProduct.quantity
            }, {
              withCredentials: true
            });

            // Update cart locally
            setCart(prevCart => {
              const existingIndex = prevCart.findIndex(item => item.id === selectedProduct.id);
              if (existingIndex >= 0) {
                const updated = [...prevCart];
                updated[existingIndex].quantity += selectedProduct.quantity;
                return updated;
              } else {
                return [
                  ...prevCart,
                  {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity: selectedProduct.quantity
                  }
                ];
              }
            });

            showNotification(`Added ${selectedProduct.name} to cart!`);
            setShowModal(false);
          } catch (err) {
            console.error("Error adding to cart:", err);
            showNotification("Failed to add to cart");
          }
        }}
        disabled={(selectedProduct.quantity || 0) === 0}
      >
        Add to Cart
      </button>
    </div>
  </div>
)}

    </>
  );
};

export default Products;