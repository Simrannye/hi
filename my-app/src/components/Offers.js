import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css";
import Header from "./Header";


const Offers = () => {
  return (
    
    <>
    <Header />
    <section className="offers">
      <h1 className="heading">Special <span>Offers</span></h1>
      <div className="content">
        <p>Check out our latest offers and deals!</p>
      </div>
    </section>

    </>
  );
};



export default Offers;