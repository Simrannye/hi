// OrderConfirmation.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import Header from './Header';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    // Only clear frontend cart, don't try to clear backend
    clearCart();
  }, [clearCart]);

  return (
    <>
      <Header />
      <div className="order-confirmation-container">
        <div className="confirmation-card">
          <div className="success-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p>Your order has been placed successfully with Cash on Delivery.</p>
          <p>Thank you for shopping with us!</p>
          
          <div className="action-buttons">
            <button 
              className="view-orders-btn"
              onClick={() => navigate('/orders')}
            >
              View My Orders
            </button>
            
            <button 
              className="continue-shopping-btn" 
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;