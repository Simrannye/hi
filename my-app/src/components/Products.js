import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./Products.css";
import Header from "./Header";
import img from "./img-1.jpg";
import fruit from "./img-4.jpg";
import apple from "./img-2.jpg";




const Products = () => {
  // Product data with Nepali prices (NPR)
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Organic Mangoes",
      price: 250,
      category: "fruit",
      image: fruit,
      description: "Fresh organic mangoes, perfect for smoothies and snacks.",
      inStock: true,
      quantity: 0
    },
    {
      id: 2,
      name: "Red Apples",
      price: 320,
      category: "fruit",
      image: apple,
      description: "Crisp and juicy red apples, locally sourced.",
      inStock: true,
      quantity: 0
    },
    {
      id: 3,
      name: "Whole Milk",
      price: 510,
      category: "dairy",
      image: "",
      description: "Farm fresh whole milk, pasteurized and homogenized.",
      inStock: true,
      quantity: 0
    },
    {
      id: 4,
      name: "Sourdough Bread",
      price: 580,
      category: "bakery",
      image: "",
      description: "Artisanal sourdough bread baked fresh daily.",
      inStock: true,
      quantity: 0
    },
    {
      id: 5,
      name: "Free-Range Eggs",
      price: 760,
      category: "dairy",
      image: "",
      description: "",
      inStock: true,
      quantity: 0
    },
    {
      id: 6,
      name: "Organic Spinach",
      price: 450,
      category: "vegetable",
      image: "",
      description: "Fresh organic spinach, washed and ready to eat.",
      inStock: false,
      quantity: 0
    },
    {
      id: 7,
      name: "Ground Beef",
      price: 1020,
      category: "meat",
      image: img,
      description: "Lean ground beef, perfect for burgers and tacos.",
      inStock: true,
      quantity: 0
    },
    {
      id: 8,
      name: "Chicken Breast",
      price: 900,
      category: "meat",
      image: "./img-1.jpg",
      description: "Boneless, skinless chicken breasts from free-range chickens.",
      inStock: true,
      quantity: 0
    }
  ]);

  // State variables
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);

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
          ? { ...product, quantity: product.quantity + 1 } 
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

  // Add product to cart
  const addToCart = (id) => {
    const product = products.find(p => p.id === id);
    
    if (!product || product.quantity === 0) return;
    
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === id);
      
      if (existingItemIndex >= 0) {
        // Item already in cart, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += product.quantity;
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity
        }];
      }
    });
    
    // Reset product quantity
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === id ? { ...p, quantity: 0 } : p
      )
    );
    
    // Show notification
    showNotification(`Added ${product.name} to cart!`);
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
    showNotification("Proceeding to checkout!");
    window.location.href = "/checkout";
  };

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
          <button 
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Products
          </button>
          <button 
            className={`filter-btn ${activeCategory === 'fruit' ? 'active' : ''}`}
            onClick={() => setActiveCategory('fruit')}
          >
            Fruits
          </button>
          <button 
            className={`filter-btn ${activeCategory === 'vegetable' ? 'active' : ''}`}
            onClick={() => setActiveCategory('vegetable')}
          >
            Vegetables
          </button>
          <button 
            className={`filter-btn ${activeCategory === 'dairy' ? 'active' : ''}`}
            onClick={() => setActiveCategory('dairy')}
          >
            Dairy
          </button>
          <button 
            className={`filter-btn ${activeCategory === 'bakery' ? 'active' : ''}`}
            onClick={() => setActiveCategory('bakery')}
          >
            Bakery
          </button>
          <button 
            className={`filter-btn ${activeCategory === 'meat' ? 'active' : ''}`}
            onClick={() => setActiveCategory('meat')}
          >
            Meat
          </button>
        </div>
        
        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}
            >
              <img src={product.image} alt={product.name} className="product-image" />
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">NPR {product.price.toFixed(2)}</p>
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
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={() => addToCart(product.id)}
                  >
                    Add to Cart
                  </button>
                </>
              )}
            </div>
          ))}
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
    </>
  );
};

export default Products;