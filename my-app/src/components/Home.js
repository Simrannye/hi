import React from 'react';
import { Link } from 'react-router-dom';
import "./Home.css";
import Header from "./Header";

const Home = () => {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="home">
        <div className="content">
          <h3>Fresh Produce</h3>
          <span>Locally Grown Fruits & Vegetables</span>
          <p>We provide the best and freshest produce directly from farmers.</p>
          <Link to="/Products" className="probtn">Shop Now</Link>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="featured-categories">
        <h2>Shop By Category</h2>
        <div className="category-container">
          <div className="category-card">
            <img src="/images/fruits.jpg" alt="Fresh Fruits" />
            <h3>Fruits</h3>
            <Link to="/Products">Browse Fruits</Link>
          </div>
          <div className="category-card">
            <img src="/images/vegetables.jpg" alt="Fresh Vegetables" />
            <h3>Vegetables</h3>
            <Link to="/Products">Browse Vegetables</Link>
          </div>
          <div className="category-card">
            <img src="/images/dairy.jpg" alt="Dairy Products" />
            <h3>Dairy</h3>
            <Link to="/Products">Browse Dairy</Link>
          </div>
          <div className="category-card">
            <img src="/images/bakery.jpg" alt="Bakery Items" />
            <h3>Bakery</h3>
            <Link to="/Products">Browse Bakery</Link>
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="special-offers">
        <h2>Special Offers</h2>
        <div className="offers-container">
          <div className="offer-card">
            <div className="discount-badge">20% OFF</div>
            <img src="/images/seasonal-fruits.jpg" alt="Seasonal Fruits" />
            <h3>Seasonal Fruits</h3>
            <p>Get 20% off on all seasonal fruits this week!</p>
            <Link to="/offers" className="offer-btn">View Offer</Link>
          </div>
          <div className="offer-card">
            <div className="discount-badge">Buy 1 Get 1</div>
            <img src="/images/organic-vegetables.jpg" alt="Organic Vegetables" />
            <h3>Organic Vegetables</h3>
            <p>Buy one get one free on selected organic vegetables!</p>
            <Link to="/offers" className="offer-btn">View Offer</Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <h2>Why Choose GrabNGo?</h2>
        <div className="features-container">
          <div className="feature">
            <div className="feature-icon">🌱</div>
            <h3>Farm Fresh</h3>
            <p>Directly sourced from local farmers for maximum freshness</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Same-day delivery for orders placed before 2 PM</p>
          </div>
          <div className="feature">
            <div className="feature-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Competitive pricing with regular promotions and discounts</p>
          </div>
          <div className="feature">
            <div className="feature-icon">♻️</div>
            <h3>Eco-Friendly</h3>
            <p>Sustainable packaging and environmentally conscious practices</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Browse & Select</h3>
            <p>Choose from our wide range of fresh groceries</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Quick Checkout</h3>
            <p>Secure and hassle-free payment options</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Fast Delivery</h3>
            <p>Get your groceries delivered to your doorstep</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="quote-icon">"</div>
            <p>The freshest vegetables I've ever had from a delivery service. Their same-day delivery is a lifesaver!</p>
            <div className="customer-info">
              <div className="customer-avatar">
                <img src="/images/customer1.jpg" alt="Sarah M." />
              </div>
              <div className="customer-name">Sarah M.</div>
              <div className="rating">★★★★★</div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="quote-icon">"</div>
            <p>Great prices and exceptional quality. I love that they source from local farmers. Will definitely continue ordering!</p>
            <div className="customer-info">
              <div className="customer-avatar">
                <img src="/images/customer2.jpg" alt="Raj P." />
              </div>
              <div className="customer-name">Raj P.</div>
              <div className="rating">★★★★★</div>
            </div>
          </div>
        </div>
      </section>

      {/* App Banner Section */}
      <section className="app-banner">
        <div className="app-content">
          <h2>Shop On The Go</h2>
          <p>Download our mobile app for a seamless grocery shopping experience.</p>
          <div className="app-buttons">
            <a href="#" className="app-btn">
              <img src="/images/app-store.png" alt="Download on App Store" />
            </a>
            <a href="#" className="app-btn">
              <img src="/images/play-store.png" alt="Get it on Google Play" />
            </a>
          </div>
        </div>
        <div className="app-image">
          <img src="/images/mobile-app.png" alt="GrabNGo Mobile App" />
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <h2>Stay Updated</h2>
        <p>Subscribe to our newsletter and get the latest offers directly to your inbox.</p>
        <form className="newsletter-form">
          <input type="email" placeholder="Your email address" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </>
  );
};

export default Home;