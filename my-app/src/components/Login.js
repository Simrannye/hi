import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './log.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleRememberMeChange = (e) => setRememberMe(e.target.checked);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your login logic here (e.g., API call)
    console.log('Logged in with:', { email, password, rememberMe });
  };

  return (
    <div>
      

      <main>
        <div className="login-container">
          <h2>Login</h2>
          <form id="loginForm" onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              required
            />

            <div className="remember-forgot">
              <label>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                />{' '}
                Remember Me
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="login-btn">Login</button>
          </form>

          <p className="signup-link">
            Don't have an account? <Link to="/Signup">Sign Up</Link>
          </p>
        </div>
      </main>

      {/* <footer>
        <p>&copy; 2025 GrabnGo All rights reserved.</p>
      </footer> */}
    </div>
  );
};



export default Login;
