import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import Header from "./Header"; 
import './Checkout.css';
import cartImage from "./cart.jpg";
// import { initiateKhaltiPayment } from '../services/khaltiService';





const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const [user, setUser] = useState({ username: 'Guest', email: '', phone: '' });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingState, setProcessingState] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/status', {
          withCredentials: true,
        });
        if (res.data.authenticated) {
          setUser({
            username: res.data.user.username,
            email: res.data.user.email,
            phone: res.data.user.phone || '9800000000' // fallback
          });
        }
      } catch (err) {
        console.warn('User not logged in');
      }
    };

    fetchUser();
  }, []);

  // Get cart items from location state
  const cart = location.state?.cart || [];
  const totalAmount = location.state?.totalAmount || 0;
  
  // Generate a random purchase order ID
  const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  };


    
  const handleKhaltiPayment = async () => {

  
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }
  
    try {
      setPaymentProcessing(true);
      setProcessingState('loading');
      setError(null);
  
      // Check if user is logged in
      const token = localStorage.getItem("token");

      const itemsData = cart;
  
      // Initiate payment through backend API
      const response = await axios.post("http://localhost:5000/api/payments/initiate", {
        amount: totalAmount,
        items: itemsData,
        customerUsername: user.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      console.log("Payment initiation response:", response.data);
  
      if (response.data.payment_url) {
        // Store order data temporarily
        localStorage.setItem("pendingOrder", JSON.stringify({
          items: itemsData,
          totalAmount,
          customerUsername: user.username,
          pidx: response.data.pidx
        }));
        
      
        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setPaymentProcessing(false);
        setProcessingState('error');
            }
  
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.response?.data?.message || "Payment failed. Please try again.");
      setPaymentProcessing(false);
      setProcessingState('error');
    }
  };
  
  // Handle Cash on Delivery
  const handleCOD = async () => {
    try {
      const orderDetails = {
        customer: user.username,
        items: cart,
        totalAmount,
        paymentMethod: 'COD',
        orderDate: new Date().toISOString()
      };
  
      console.log("Sending order details:", orderDetails);
  
      const res = await axios.post('http://localhost:5000/api/orders', orderDetails, {
        withCredentials: true
      });
  
      // Clear cart from DB
      await axios.delete('http://localhost:5000/api/cart/clear', {
        withCredentials: true
      });
  
      console.log("Order response:", res.data);
      alert("Order placed successfully with Cash on Delivery!");
      navigate("/");
    } catch (error) {
      console.error("Error placing COD order:", error);
      setError("Failed to place order. Please try again.");
    }
  };

  // Calculate the breakdown for display purposes
  const subtotal = totalAmount ? (totalAmount * 0.87).toFixed(2) : 0;
  const vat = totalAmount ? (totalAmount * 0.13).toFixed(2) : 0;

  return (
    <>
      <Header />
      <div className="checkout-container">
        <h2>Checkout</h2>

        <img src={cartImage} alt="Cart" className="cart-image" />

        <div className="checkout-items">
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="checkout-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="checkout-summary">
                <div className="summary-item">
                  <span>Subtotal:</span>
                  <span>NPR {subtotal}</span>
                </div>
                <div className="summary-item">
                  <span>VAT (13%):</span>
                  <span>NPR {vat}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="checkout-total">Total Amount: NPR {totalAmount}</p>

        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}

        <div className="payment-options">
          {!showFallback && (
            <button 
              className="pay-button" 
              onClick={handleKhaltiPayment} 
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? "Processing..." : "Pay with Khalti"}
            </button>
          )}

          <button 
            className="cod-button" 
            onClick={handleCOD} 
            disabled={isProcessing || cart.length === 0}
          >
            Cash on Delivery
          </button>
          
          {showFallback && (
            <button 
              className="retry-button" 
              onClick={() => {
                setShowFallback(false);
                setError(null);
              }}
            >
              Try Khalti Again
            </button>
          )}
        </div>
        
        {isProcessing && (
          <div className="processing-message">
            <p>Processing your payment. Please wait...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout; 