import React from 'react';
import { Link } from 'react-router-dom';
import "./cart.css";
import Header from "./Header";
import img1 from "./img-1.jpg";
import img2 from "./img-2.jpg";
import img3 from "./img-3.jpg";
import "./cart.jpg";

const Cart = () => {
  // Sample cart data - in a real app, this would likely come from state management
  const cartItems = [
    {
      id: 1,
      name: 'Fresh Tomato',
      price: 120,
      quantity: 2,
      image: img1
    },
    {
      id: 2,
      name: 'Organic Potato',
      price: 120,
      quantity: 1,
      image: img2
    },
    {
      id: 3,
      name: 'Apple',
      price: 120,
      quantity: 1,
      image: img3
    }
  ];

  // Calculate cart totals
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleRemoveItem = (itemId) => {
    // Implement remove functionality
    console.log(`Removing item ${itemId}`);
  };

  const handleCheckout = () => {
    // Implement checkout functionality
    console.log('Proceeding to checkout');
  };

  return (
    <>
    <Header />
    <section className="cart">
    

      <div className="cart-content">
        <div className="cart-container">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} />
              <div className="item-details">
                <h2>{item.name}</h2>
                <p>Price: NPR {item.price}</p>
                <p>Quantity: {item.quantity}</p>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Cart Summary</h2>
          <p>Total Items: {totalItems}</p>
          <p>Total Price: NPR {totalPrice}</p>
          <img src="cart.jpg" alt="cart" />
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </section>
    </>
    
  );
};

export default Cart;