import React from "react";
import { Link } from 'react-router-dom';

import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} GrabNGo. All rights reserved.</p>
      <div className="footer-links">
  <Link to="/contact">Contact</Link>
  <Link to="/products">Products</Link>
  <Link to="/terms" className="terms-link">Terms & Conditions</Link>
</div>
    </footer>
  );
};

export default Footer;
