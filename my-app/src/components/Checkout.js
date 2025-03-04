import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from "./Header";
import Home from "./Home"
import './Checkout.css'; // You'll need to create this CSS file

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(150); // Default shipping fee in NPR
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  // Fetch cart data from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      
      // Calculate subtotal
      const cartSubtotal = parsedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setSubtotal(cartSubtotal);
      
      // Calculate tax (13% VAT)
      const taxAmount = cartSubtotal * 0.13;
      setTax(taxAmount);
      
      // Calculate total
      setTotal(cartSubtotal + taxAmount + shippingFee);
    }
  }, [shippingFee]);

  // Handle input change for billing info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo({
      ...billingInfo,
      [name]: value
    });
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (paymentMethod === "esewa") {
      const esewaURL = `https://esewa.com.np/epay/main`;
      const params = new URLSearchParams({
        amt: subtotal.toFixed(2), // Amount (excluding VAT and Service Charge)
        txAmt: tax.toFixed(2), // Tax amount
        psc: shippingFee.toFixed(2), // Shipping (service charge)
        pdc: "0", // Promo discount (if any)
        tAmt: total.toFixed(2), // Total amount
        pid: `ORDER-${Date.now()}`, // Unique order ID
        scd: "your_merchant_id", // Replace with your eSewa Merchant ID
        su: "http://yourwebsite.com/success", // Success callback URL
        fu: "http://yourwebsite.com/failure", // Failure callback URL
      });
  
      // Redirect to eSewa Payment Page
      window.location.href = `${esewaURL}?${params.toString()}`;
    } else {
      alert("Order placed successfully!");
      localStorage.removeItem("cart");
      window.location.href = Home;
    }
  };
  

  return (
    <>
      <Header />
      <div className="checkout-container">
        <h1>Checkout</h1>
        
        <div className="checkout-content">
          {/* Left column - Order summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="cart-items-container">
              {cart.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="checkout-item">
                      <div className="item-details">
                        <h3>{item.name}</h3>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        NPR {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>NPR {subtotal.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Shipping</span>
                <span>NPR {shippingFee.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Tax (13% VAT)</span>
                <span>NPR {tax.toFixed(2)}</span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span>NPR {total.toFixed(2)}</span>
              </div>
            </div>
            
            <Link to="/" className="continue-shopping-btn">
              ← Continue Shopping
            </Link>
          </div>
          
          {/* Right column - Payment form */}
          <div className="payment-section">
            <h2>Payment Details</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Billing Information</h3>
                
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={billingInfo.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={billingInfo.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={billingInfo.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={billingInfo.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={billingInfo.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="province">Province</label>
                    <select
                      id="province"
                      name="province"
                      value={billingInfo.province}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Province</option>
                      <option value="province1">Province 1</option>
                      <option value="province2">Province 2</option>
                      <option value="bagmati">Bagmati</option>
                      <option value="gandaki">Gandaki</option>
                      <option value="lumbini">Lumbini</option>
                      <option value="karnali">Karnali</option>
                      <option value="sudurpashchim">Sudurpashchim</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={billingInfo.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Payment Method</h3>
                
                <div className="payment-methods">
                  <div 
                    className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => handlePaymentMethodChange('card')}
                  >
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => {}}
                    />
                    <label htmlFor="card">Credit/Debit Card</label>
                  </div>
                  
                  <div 
                    className={`payment-method ${paymentMethod === 'esewa' ? 'active' : ''}`}
                    onClick={() => handlePaymentMethodChange('esewa')}
                  >
                    <input
                      type="radio"
                      id="esewa"
                      name="paymentMethod"
                      checked={paymentMethod === 'esewa'}
                      onChange={() => {}}
                    />
                    <label htmlFor="esewa">eSewa</label>
                  </div>
                  
                  <div 
                    className={`payment-method ${paymentMethod === 'khalti' ? 'active' : ''}`}
                    onClick={() => handlePaymentMethodChange('khalti')}
                  >
                    <input
                      type="radio"
                      id="khalti"
                      name="paymentMethod"
                      checked={paymentMethod === 'khalti'}
                      onChange={() => {}}
                    />
                    <label htmlFor="khalti">Khalti</label>
                  </div>
                  
                  <div 
                    className={`payment-method ${paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => handlePaymentMethodChange('cod')}
                  >
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => {}}
                    />
                    <label htmlFor="cod">Cash on Delivery</label>
                  </div>
                </div>
                
                {paymentMethod === 'card' && (
                  <div className="card-details">
                    <div className="form-group">
                      <label htmlFor="cardName">Name on Card</label>
                      <input type="text" id="cardName" required />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input 
                        type="text" 
                        id="cardNumber" 
                        placeholder="1234 5678 9012 3456" 
                        required 
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiry">Expiry Date</label>
                        <input 
                          type="text" 
                          id="expiry" 
                          placeholder="MM/YY" 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="cvv">CVV</label>
                        <input 
                          type="text" 
                          id="cvv" 
                          placeholder="123" 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-total-display">
                <span>Total Amount:</span>
                <span className="total-amount">NPR {total.toFixed(2)}</span>
              </div>
              
              <button type="submit" className="place-order-btn">
                Place Order
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;