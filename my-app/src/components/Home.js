import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css";
import Header from "./Header";


const Home = () => {
    return (
      
      <>
      <Header />
  
    <section className="home">
      <div className="content">
        <h3>Fresh Produce</h3>
        <span>Locally Grown Fruits & Vegetables</span>
        <p>We provide the best and freshest produce directly from farmers.</p>
        <Link to="/products" className="probtn">Shop Now</Link>
      </div>
    </section>
  
      </>
    );
  };
  


export default Home;