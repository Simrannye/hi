import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import "./Home.css";
import Header from "./Header";
import fruit from "./choosefruit.avif";
import veggie from "./veggie.jpeg";
import dairy from "./dairy.jpg";
import bakery from "./bakery.jpg";
import review from "./review.jpeg";
import Footer from "./Footer";
import axios from 'axios';
import { useUserContext } from './context/UserContext';

const Home = () => {
  const { user } = useUserContext();
  const [recommended, setRecommended] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null); // For debugging purposes

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Only fetch recommendations if user is logged in
      if (!user || !user.username) {
        console.log("No user logged in or no username available");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching recommendations for user: ${user.username}`);
        const res = await axios.get(`http://localhost:5000/api/recommendations/${user.username}`);
        
        // Store the full response for debugging
        setDebug(res.data);
        console.log("API Response:", res.data);
        
        // Check if the response contains recommendations property and it's an array
        if (res.data && Array.isArray(res.data.recommendations)) {
          setRecommended(res.data.recommendations);
          console.log(`Set ${res.data.recommendations.length} recommendations`);
        } else {
          console.warn("Invalid recommendations format in API response");
          setRecommended([]);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchRecommendations();
  }, [user]);

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
            <img src={fruit} alt="Fresh Fruits" />
            <h3>Fruits</h3>
            <Link to="/Products?category=Fruits">Browse Fruits</Link>
          </div>
          <div className="category-card">
            <img src={veggie} alt="Fresh Vegetables" />
            <h3>Vegetables</h3>
            <Link to="/Products?category=Vegetables">Browse Vegetables</Link>
          </div>
          <div className="category-card">
            <img src={dairy} alt="Dairy Products" />
            <h3>Dairy</h3>
            <Link to="/Products?category=Dairy">Browse Dairy</Link>
          </div>
          <div className="category-card">
            <img src={bakery} alt="Bakery Items" />
            <h3>Bakery</h3>
            <Link to="/Products?category=Bakery">Browse Bakery</Link>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      {user && (
        <section className="recommended-section">
          <h2>Recommended for You</h2>
          
          {isLoading && <div className="loading">Loading recommendations...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!isLoading && !error && recommended && recommended.length > 0 ? (
            <div className="products-grid">
              {recommended.map(product => (
                <div key={product.id} className="product-card">
                  <img 
                    src={`http://localhost:5000${product.image}`} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">Category: {product.category}</p>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price"><strong>NPR {product.price}</strong></p>
                  <Link to={`/Products?id=${product.id}`} className="view-product-btn">
                    View Product
                  </Link>
                </div>
              ))}
            </div>
          ) : !isLoading && !error ? (
            <div className="no-recommendations">
              <p>No personalized recommendations available yet. Keep shopping to get recommendations based on your preferences!</p>
            </div>
          ) : null}
          
          {/* Debug info - remove in production
          {debug && process.env.NODE_ENV === 'development' && (
            <div className="debug-info" style={{ margin: "20px", padding: "10px", border: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
              <h4>Debug Information:</h4>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          )} */}
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        {/* Other sections remain unchanged */}
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

      {/* Rest of the component remains the same */}
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

      <section className="testimonials">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="quote-icon">"</div>
            <p>The freshest vegetables I've ever had from a delivery service. Their same-day delivery is a lifesaver!</p>
            <div className="customer-info">
              <div className="customer-avatar">
                <img src={review} alt="Sarah M." />
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
                <img src={review} alt="Raj P." />
              </div>
              <div className="customer-name">Raj P.</div>
              <div className="rating">★★★★★</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Home;