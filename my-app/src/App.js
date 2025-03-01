import React, {useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, data } from "react-router-dom";
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







// Main App Component
function App() {

  return (
    
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<ProtectedRoute>
            <Home />
          </ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute>
            <About />
          </ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute>
            <Offers />
          </ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute>
            <Contact/>
          </ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute>
            <Cart/>
          </ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute>
            <Profile />
          </ProtectedRoute>} />\
            <Route path="/UserSetting" element={<ProtectedRoute>
            <UserSetting />
          </ProtectedRoute>} />
            <Route path="/userauth" element={<UserAuth />} />
            

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
//test commit