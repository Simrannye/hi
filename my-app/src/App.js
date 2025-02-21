import React, {useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, data } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./App.css";
import logo from "./grab.png";
import icons from "./icon-1.png";
import icon from "./icon-2.png";
import aboutImage from "./home.jpg";
import contactImg from "./fruit.jpg"
import Cart from "./components/Cart";
import UserSetting from "./components/UserSetting";
import Header from "./components/Header";
import Login from "./components/Login";
import Signup from "./components/Signup";


// Footer Component
const Footer = () => {
  return (
    <footer className="footer">
      <div className="credit"> &copy; <span>GrabnGo</span> | All Rights Reserved </div>
    </footer>
  );
};

// Home Page Component
const Home = () => {
  return (
    <section className="home">
      <div className="content">
        <h3>Fresh Produce</h3>
        <span>Locally Grown Fruits & Vegetables</span>
        <p>We provide the best and freshest produce directly from farmers.</p>
        <Link to="/products" className="btn">Shop Now</Link>
      </div>
    </section>
  );
};

// About Page Component
const About = () => {
  return (
    <section className="about">
    <h1 className="heading">
      Get to <span>Know Us</span>
    </h1>

    <div className="about-container">
      {/* Image Section */}
      <div className="about-image">
        <img src={aboutImage} alt="Fresh farm produce" />
      </div>

      {/* Description Section */}
      <div className="about-content">
        <h3>Why Choose Our Store?</h3>
        <p>
          We bring nature’s freshest produce directly to your doorstep. Our
          carefully selected products ensure top quality, sustainability, and
          a taste you can trust.
        </p>
        <p>
          With daily deliveries and hand-picked ingredients, freshness is
          guaranteed every time you shop with us.
        </p>
      </div>
    </div>

    {/* Features Section - Icons in Vertical Layout */}
    <div className="features">
      <div className="feature">
      <img src={icons} className="icon" alt="Free delivery" />
        <div className="info">
          <h3>Swift Delivery</h3>
          <span>Right to your doorstep</span>
        </div>
      </div>

      <div className="feature">
      <img src={icon} className="icon" alt="Easy Payments" />
        <div className="info">
          <h3>Seamless Payments</h3>
          <span>Multiple payment options</span>
        </div>
      </div>

      {/* <div className="feature">
      <img src={icon1} className="icon" alt="Offers & Gifts"
        <div className="info">
          <h3>Special Offers</h3>
          <span>Exciting deals on every purchase</span>
        </div>
      </div> */}
    </div>
  </section>
  
  );
};

// Contact Page Component
const Contact = () => {
  return (
    <section className="contact">
      <h1 className="heading">Contact <span>Us</span></h1>
      <div className="contact-container">
        {/* Left Side - Image */}
        <div className="contact-image">
          <img src={contactImg} alt="Contact Us" />
        </div>

        {/* Right Side - Form */}
        <div className="contact-form">
          <form action="">
            <input type="text" placeholder="Name" className="box" />
            <input type="email" placeholder="Email" className="box" />
            <input type="text" placeholder="Phone Number" className="box" />
            <textarea className="box" placeholder="Message" cols="30" rows="10"></textarea>
            <input type="submit" value="Send Message" className="btn" />
          </form>
        </div>
      </div>
    </section>
  );
};

// Offers Page Component
const Offers = () => {
  return (
    <section className="offers">
      <h1 className="heading">Special <span>Offers</span></h1>
      <div className="content">
        <p>Check out our latest offers and deals!</p>
      </div>
    </section>
  );
};

// // Cart Page Component
// const Cart = () => {
//   return (
//     <section className="cart">
//       <h1 className="heading">Shopping <span>Cart</span></h1>
//       <div className="content">
//         <p>Your cart items will appear here</p>
//       </div>
//     </section>
//   );
// };

// Profile Page Component
const Profile = () => {
  return (
    <section className="profile">
      <h1 className="heading">User <span>Profile</span></h1>
      <div className="content">
        <p>Your profile information will appear here</p>
      </div>
    </section>
  );
};

// Main App Component
function App() {

  const [backendData, setBackendData] = useState([{}])
  useEffect(() => {
  fetch("/api").then(
    response => response.json()
  ).then(
    data => {
      setBackendData(data)
    }
  )
}, [])

  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />\
            <Route path="/UserSetting" element={<UserSetting />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
//test commit