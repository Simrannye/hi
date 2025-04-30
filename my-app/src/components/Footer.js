import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} GrabNGo. All rights reserved.</p>
      <div className="footer-links">
        <a href="/contact">Contact</a>
        <a href="/products">Products</a>
        {/* <a href="/userauth">Login</a> */}
      </div>
    </footer>
  );
};

export default Footer;
