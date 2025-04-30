import "../App.css";
import Header from "./Header";
import contactImg from "./contact.avif";
import React, { useState } from 'react';
import axios from 'axios';
import Footer from "./Footer";




const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await axios.post("http://localhost:5000/api/contact", form);
      if (res.data.success) {
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", message: "" });
  
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };
  

  return (
    <>
      <Header />
      <section className="contact">
        <div className="contact-container">
          <div className="contact-image">
            <img src={contactImg} alt="Contact Us" />
          </div>

          <div className="contact-form">
          <h1 className="contact-heading">Contact Us</h1>

            {submitted ? (
                <div className="success-message">
                <p>Message sent successfully!</p>
                <button onClick={() => setSubmitted(false)} className="messagebtn">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <input name="name" type="text" placeholder="Name" className="box" value={form.name} onChange={handleChange} />
                <input name="email" type="email" placeholder="Email" className="box" value={form.email} onChange={handleChange} />
                <input name="phone" type="text" placeholder="Phone Number" className="box" value={form.phone} onChange={handleChange} />
                <textarea name="message" className="box" placeholder="Message" cols="30" rows="10" value={form.message} onChange={handleChange}></textarea>
                <input type="submit" value="Send Message" className="messagebtn" />
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer/>
    </>
  );
};




export default Contact;