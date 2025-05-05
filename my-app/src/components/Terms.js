import React from 'react';
import Header from './Header';
import './Terms.css';
import Footer from './Footer';


const Terms = () => {
  return (
    <>
      <Header />
      <div className="terms-container">
        <h1>Terms and Conditions</h1>
        <p>Welcome to GrabNGo. By using our services, you agree to the following terms:</p>

        <h3>1. Usage</h3>
        <p>You agree to use our platform lawfully and respectfully, without engaging in fraudulent or harmful behavior.</p>

        <h3>2. Orders and Payments</h3>
        <p>All orders are subject to availability. Payments made via Khalti are securely processed and non-refundable once confirmed.</p>

        <h3>3. Delivery</h3>
        <p>We aim to deliver on time, but delivery times may vary due to unforeseen circumstances.</p>

        <h3>4. Changes</h3>
        <p>We reserve the right to change these terms at any time. Continued use of the site constitutes acceptance of the new terms.</p>

        <h3>5. Contact</h3>
        <p>If you have questions, please contact us through our contact page.</p>
      </div>
      <Footer/>
    </>
    
  );
};

export default Terms;
