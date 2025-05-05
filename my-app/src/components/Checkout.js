import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Header from "./Header";
import './Checkout.css';
import cartImage from "./cart.jpg";
import { useCart } from './CartContext'; // ✅ use CartContext

const Checkout = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [user, setUser] = useState({ username: 'Guest', email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const { cartItems: cart, clearCart } = useCart(); // ✅ grab cart and clearCart from context

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  const subtotal = (totalAmount * 0.87).toFixed(2);
  const vat = (totalAmount * 0.13).toFixed(2);

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
            phone: res.data.user.phone || '9800000000'
          });
        }
      } catch (err) {
        console.warn('User not logged in');
      }
    };

    fetchUser();
  }, []);

  const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  };

  const handleKhaltiPayment = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const token = localStorage.getItem("token");

      const response = await axios.post("http://localhost:5000/api/payments/initiate", {
        amount: totalAmount,
        items: cart,
        customerUsername: user.username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_url) {
        localStorage.setItem("pendingOrder", JSON.stringify({
          items: cart,
          totalAmount,
          customerUsername: user.username,
          pidx: response.data.pidx
        }));

        window.location.href = response.data.payment_url;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.response?.data?.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleCOD = async () => {
    try {
      const orderDetails = {
        customer: user.username,
        items: cart,
        totalAmount,
        paymentMethod: 'COD',
        orderDate: new Date().toISOString()
      };

      const res = await axios.post('http://localhost:5000/api/orders', orderDetails, {
        withCredentials: true
      });

      await axios.delete('http://localhost:5000/api/cart/clear', {
        withCredentials: true
      });

      clearCart(); // ✅ also clear frontend cart
      alert("Order placed successfully with Cash on Delivery!");
      navigate("/");
    } catch (error) {
      console.error("Error placing COD order:", error);
      setError("Failed to place order. Please try again.");
    }
  };

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
