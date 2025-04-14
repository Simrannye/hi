import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';




import Cart from "./components/Cart";
import Contact from "./components/Contact";
import Offers from "./components/Offers";
import Profile from "./components/Profile";
import About from "./components/About";
import UserAuth from './components/UserAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import UserSetting from "./components/UserSetting";
import Products from "./components/Products";
import Checkout from "./components/Checkout";
import AdminPannel from "./AdminPannel";
import ForgotPassword from './components/ForgotPassword';
import PaymentSuccess from './components/PaymentSuccess';
import UserOrders from './components/UserOrders'; 

import axios from 'axios';
axios.defaults.withCredentials = true;
function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // 1. Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/status', {
          withCredentials: true,
        });
        if (res.data.authenticated) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // 2. Fetch cart if user is logged in
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/cart', {
          withCredentials: true,
        });
        setCart(res.data);
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    };

    if (user) {
      fetchCart();
    }
  }, [user]);

  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/UserSetting" element={<ProtectedRoute><UserSetting /></ProtectedRoute>} />
            <Route path="/Products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/AdminPannel" element={<ProtectedRoute><AdminPannel /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><UserOrders user={user} /></ProtectedRoute>} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/userauth" element={<UserAuth />} />
            <Route path="/forgot" element={<ForgotPassword />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
