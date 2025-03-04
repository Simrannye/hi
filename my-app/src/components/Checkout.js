import React from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import KhaltiCheckout from "khalti-checkout-web";
import config from "./khaltiConfig";
import Header from "./Header"; 
import './Checkout.css';
import cartImage from "./cart.jpg"; // Import cart image

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = location.state?.cart || []; // Get cart items
  const totalAmount = location.state?.totalAmount || 0;

  const khaltiCheckout = new KhaltiCheckout(config);

  const handlePayment = () => {
    khaltiCheckout.show({ amount: totalAmount * 100 }); // Khalti requires paisa
  };

  const handleCOD = async () => {
    const orderDetails = {
      customer: "John Doe", // Replace with actual user name from authentication
      cart: cart.map(item => ({
        productname: item.name,
        quantity: item.quantity
      })),
      totalAmount,
      payment: "Cash",
      status: "Pending",
    };
  
    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDetails),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(" Order placed successfully!", {
          position: "top-center",
          autoClose: 3000,
        });
  
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        alert("Order placement failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(" Server error! Try again later.");
    }
  };
  
  
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
            cart.map((item) => (
              <div key={item.id} className="checkout-item">
                <span>{item.name} x {item.quantity}</span>
                <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Total Amount */}
        <p className="checkout-total">Total Amount: NPR {totalAmount}</p>

        {/* Payment Options */}
        <div className="payment-options">
          <button className="pay-button" onClick={handlePayment}>
            Pay with Khalti
          </button>
          <button className="cod-button" onClick={handleCOD}>
            Cash on Delivery
          </button>
        </div>
      </div>
    </>
  );
};

export default Checkout;
