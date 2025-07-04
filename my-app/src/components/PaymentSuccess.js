import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyKhaltiPayment } from '../services/khaltiService';
import Header from './Header';
import { useCart } from './CartContext';
import "./PaymentSucess.css";
import axios from 'axios';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const orderSavedRef = useRef(false);
  const { clearCart, fetchCartFromBackend } = useCart();
  
  useEffect(() => {
    // Extract query parameters from URL
    const params = new URLSearchParams(location.search);
    const pidx = params.get('pidx');
    const status = params.get('status');
    const txnId = params.get('transaction_id');
    const amount = params.get('amount');
    const purchaseOrderId = params.get('purchase_order_id');
    console.log("🔍 PIDX:", pidx);
    
    // Early check for user canceled or errors
    if (status === 'User canceled') {
      setStatus('canceled');
      return;
    }
  
    if (!pidx) {
      setStatus('failed');
      setError('Invalid payment response');
      return;
    }
  
    // Set initial payment details from URL params
    setPaymentDetails({
      pidx,
      status,
      transaction_id: txnId,
      amount: amount ? parseInt(amount)/100 : 0, // Convert from paisa to NPR
      purchase_order_id: purchaseOrderId
    });
  
    // Verify payment with server
    const verifyPayment = async () => {
      try {
        const result = await verifyKhaltiPayment(pidx);

        if (result.status === 'Completed') {
          setStatus('success');
    
          const pendingOrder = JSON.parse(localStorage.getItem("pendingOrder"));
    
          if (!orderSavedRef.current) {
            orderSavedRef.current = true;
            try {
              // First, save the order to the database
              await axios.post("http://localhost:5000/api/orders", {
                customer: pendingOrder.customerUsername || result.purchase_order_id || "Guest",
                items: pendingOrder.items,
                totalAmount: result.total_amount / 100,
                paymentMethod: 'Khalti',
                orderDate: new Date().toISOString(),
                pidx: result.pidx
              });
              
              console.log("Order saved successfully");
              
              // Clear the cart in backend first
              try {
                await axios.delete("http://localhost:5000/api/cart/clear", {
                  withCredentials: true
                });
                console.log("Backend cart cleared successfully");
              } catch (clearError) {
                console.error("Failed to clear backend cart:", clearError);
              }
              
              // Then clear the cart in frontend
              try {
                clearCart();
                console.log("Frontend cart cleared successfully");
              } catch (clearError) {
                console.error("Failed to clear frontend cart:", clearError);
              }
              
              // Remove the pending order from localStorage
              localStorage.removeItem("pendingOrder");
              
              // Do NOT fetch cart from backend here as it might re-populate the cart
              // fetchCartFromBackend();
          
            } catch (orderError) {
              console.error("Failed to save order after payment:", orderError);
            }
          }
          
          // Update payment details with verification result
          setPaymentDetails(prevDetails => ({
            ...prevDetails,
            ...result,
            amount: result.total_amount/100, // Convert from paisa to NPR
          }));
        } else if (result.status === 'Pending') {
          setStatus('pending');
        } else if (result.status === 'Refunded') {
          setStatus('failed');
          setError('Payment was refunded');
        } else if (result.status === 'Expired') {
          setStatus('failed');
          setError('Payment link expired');
        } else {
          setStatus('failed');
          setError(`Payment ${result.status}`);
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        setStatus('failed');
        setError('Failed to verify payment. Please contact support.');
      }
    };
  
    // Always verify the payment status regardless of the redirect status
    // This follows the Khalti docs recommendation to always use lookup API
    verifyPayment();
  }, [location, clearCart]);

  const handleContinueShopping = () => {
    // Double-check to make sure cart is cleared before navigating away
    try {
      clearCart();
    } catch (e) {
      console.error("Final attempt to clear cart failed:", e);
    }
    
    navigate('/');
  };

  return (
    <>
      <Header />
      <div className="payment-result-container">
        <h2>Payment Status</h2>
        
        {status === 'verifying' && (
          <div className="status-box verifying">
            <div className="spinner"></div>
            <p>Verifying your payment...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="status-box success">
            <div className="success-icon">✓</div>
            <h3>Payment Successful!</h3>
            {paymentDetails && (
              <div className="payment-details">
                <p><strong>Order ID:</strong> {paymentDetails.purchase_order_id}</p>
                <p><strong>Transaction ID:</strong> {paymentDetails.transaction_id}</p>
                <p><strong>Amount:</strong> NPR {paymentDetails.amount}</p>
              </div>
            )}
            <p>Thank you for your purchase. Your order has been confirmed.</p>
            <button className="continue-btn" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="status-box pending">
            <h3>Payment Pending</h3>
            <p>Your payment is being processed. Please check back later.</p>
            <p>If the amount has been deducted from your account, don't worry! Your order will be confirmed soon.</p>
            <button className="continue-btn" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        )}
        
        {status === 'canceled' && (
          <div className="status-box canceled">
            <h3>Payment Canceled</h3>
            <p>You've canceled the payment process. Your cart items are still saved.</p>
            <button className="continue-btn" onClick={() => navigate('/checkout')}>
              Return to Checkout
            </button>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="status-box failed">
            <h3>Payment Failed</h3>
            <p>{error || "Something went wrong with your payment."}</p>
            <p>Please try again or choose a different payment method.</p>
            <button className="continue-btn" onClick={() => navigate('/checkout')}>
              Return to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentSuccess;