import React, {useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, data } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Cart from "./components/Cart";
import Contact from "./components/Contact";
import Offers from "./components/Offers";
import UserSetting from "./components/UserSetting";
import Header from "./components/Header";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import About from "./components/About";
import Footer from "./components/Footer";




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