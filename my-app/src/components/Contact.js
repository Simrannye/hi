import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css";
import Header from "./Header";
import contactImg from "../fruit.jpg";
import img1 from "./img-1.jpg";
import img2 from "./img-2.jpg";
import img3 from "./img-3.jpg";
import cart from "./cart.jpg";

const Contact = () => {
  return (
    
    <>
    <Header />
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
    </>
  );
};



export default Contact;