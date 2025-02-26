import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css";
import Header from "./Header";
import icons from "../icon-1.png";
import icon from "../icon-2.png";
import aboutImage from "../home.jpg";


const About = () => {
  return (
    
    <>
    <Header />

   
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

    </>
  );
};



export default About;