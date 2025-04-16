import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import Header from "./Header"; 
import './Checkout.css';
import cartImage from "./cart.jpg";
import { initiateKhaltiPayment } from '../services/khaltiService';

const Checkout = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const [user, setUser] = useState({ username: 'Guest', email: '', phone: '' });

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

  // Handle Khalti payment
  const handlePayment = async () => {
    if (cart.length === 0) {
      setError("Your cart is empty!");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setShowFallback(false);
    
    try {
      // Make sure total amount is converted to paisa (integer)
      const totalAmountPaisa = Math.floor(totalAmount * 100);

      // Create product details array from cart items
      const productDetails = cart.map(item => ({
        identity: `PROD-${item.id}`,
        name: item.name,
        total_price: Math.floor(item.price * item.quantity), // Convert to paisa
        quantity: item.quantity,
        unit_price: Math.floor(item.price * 100) // Convert to paisa
      }));
      
      // Create amount breakdown (optional but recommended)
      const subtotal = Math.floor(totalAmount * 0.87 * 100); // Assuming 13% VAT
      const vat = Math.floor(totalAmount * 0.13 * 100);
      
      // Ensure the sum of breakdown matches total
      let amountBreakdown = [
        { label: "Subtotal", amount: subtotal },
        { label: "VAT (13%)", amount: vat }
      ];

      // Check if breakdown sum matches total amount
      const sumBreakdown = subtotal + vat;
      if (sumBreakdown !== totalAmountPaisa) {
        console.warn(`Breakdown sum (${sumBreakdown}) doesn't match total (${totalAmountPaisa}). Adjusting subtotal.`);
        // Adjust subtotal to make the sum match
        const adjustedSubtotal = totalAmountPaisa - vat;
        amountBreakdown = [
          { label: "Subtotal", amount: adjustedSubtotal },
          { label: "VAT (13%)", amount: vat }
        ];
      }
      
      // Prepare payment data
      const paymentData = {
        return_url: `${window.location.origin}/payment-success`,
        website_url: window.location.origin,
        amount: totalAmountPaisa,
        purchase_order_id: generateOrderId(),
        purchase_order_name: "GrabNGo Order",
        customer_info: {
          name: user.username,
          email: user.email,
          phone: user.phone
        }
        ,
        amount_breakdown: amountBreakdown,
        product_details: productDetails
      };
      
      console.log("Sending payment data:", paymentData);
      
      // Send request to server to initiate payment
      const response = await initiateKhaltiPayment(paymentData);
      
      // Check if response contains payment_url
      if (!response.payment_url) {
        throw new Error("Invalid response from payment service");
      }
      
      // Redirect user to Khalti payment page
      window.location.href = response.payment_url;
      
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(`Khalti payment service is currently unavailable. Please try again later or choose Cash on Delivery.`);
      setShowFallback(true);
      setIsProcessing(false);
    }
  };

  // Handle Cash on Delivery
      // Store the order information in local storage if needed
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
      
          // Optional: Clear cart from DB
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

        {/* Cart Image Below Heading */}
        <img src={cartImage} alt="Cart" className="cart-image" />

        {/* Display selected items */}
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
              
              {/* Show breakdown */}
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

        {/* Total Amount */}
        <p className="checkout-total">Total Amount: NPR {totalAmount}</p>

        {/* Error message if any */}
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Payment Options */}
        <div className="payment-options">
          {!showFallback && (
            <button 
              className="pay-button" 
              onClick={handlePayment} 
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