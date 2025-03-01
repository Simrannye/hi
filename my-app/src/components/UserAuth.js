import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';
import logo from '../grab.png';

function UserAuth() {
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();
    
    // Register form state
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: ''
    });
    
    // Login form state
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    
    // Error and loading states
    const [registerError, setRegisterError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const switchToRegister = () => {
        setIsActive(true);
        setLoginError('');
    };

    const switchToLogin = () => {
        setIsActive(false);
        setRegisterError('');
    };
    
    // Handle register form changes
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData({
            ...registerData,
            [name]: value
        });
    };
    
    // Handle login form changes
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData({
            ...loginData,
            [name]: value
        });
    };
    
    // Handle register form submission
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setRegisterError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Registration successful, redirect to homepage
            navigate('/');
        } catch (error) {
            setRegisterError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle login form submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Login successful, redirect to homepage
            navigate('/');
        } catch (error) {
            setLoginError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`content justify-content-center align-items-center d-flex shadow-lg ${isActive ? "active" : ""}`} id='content'>
            {/* Registration */}
            <div className='col-md-6 d-flex justify-content-center'>
               <form onSubmit={handleRegisterSubmit}>
                    <div className="header-text mb-4">
                        <h1>Create Account</h1>
                        {registerError && <div className="alert alert-danger">{registerError}</div>}
                    </div>
                    <div className='input-group mb-3'>
                        <input 
                            type='text' 
                            name='username'
                            placeholder='Username' 
                            className='form-control'
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            required
                        />
                    </div>
                    <div className='input-group mb-3'>
                        <input 
                            type='email' 
                            name='email'
                            placeholder='Email' 
                            className='form-control'
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            required
                        />
                    </div>
                    <div className='input-group mb-3'>
                        <input 
                            type='password' 
                            name='password'
                            placeholder='Password' 
                            className='form-control'
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            required
                        />
                    </div>
                    
                    <div className='input-group mb-3 justify-content-center'>
                        <button 
                            type="submit" 
                            className='btn border-white text-white w-50 fs-6'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form> 
            </div>

            {/* Login */}
            <div className='col-md-6 right-box'>
               <form onSubmit={handleLoginSubmit}>
                    <div className="header-text mb-4">
                        <h1>Log In</h1>
                        {loginError && <div className="alert alert-danger">{loginError}</div>}
                    </div>
                    <div className='input-group mb-3'>
                        <input 
                            type='email' 
                            name='email'
                            placeholder='Email' 
                            className='form-control'
                            value={loginData.email}
                            onChange={handleLoginChange}
                            required
                        />
                    </div>
                    <div className='input-group mb-3'>
                        <input 
                            type='password' 
                            name='password'
                            placeholder='Password' 
                            className='form-control'
                            value={loginData.password}
                            onChange={handleLoginChange}
                            required
                        />
                    </div>
                    <div className='input-group mb-5 d-flex justify-content-between'>
                        <div className='forgot'>
                            <small><a href='#'>Forgot Password?</a></small>
                        </div>
                    </div>
                    <div className='input-group mb-3 justify-content-center'>
                        <button 
                            type="submit" 
                            className='btn border-white text-white w-50 fs-6'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form> 
            </div>

            {/* Switch Panel */}
            <div className='switch-content'>
                <div className='switch'>
                    <div className='switch-panel switch-left'>
                        <img src={logo} alt="GrabNGo Logo" className="logo" />
                        <h1>Have an account?</h1>
                        <p>We would be happy to see you back</p>
                        <button className='hidden btn border-white text-white w-50 fs-6' id='login' onClick={switchToLogin}>Login</button>
                    </div>
                    <div className='switch-panel switch-right'>
                        <img src={logo} alt="GrabNgo Logo" className="logo" />
                        <h1>No account yet?</h1>
                        <p>Join GrabNgo, and Stay Healthy!</p>
                        <button className='hidden btn border-white text-white w-50 fs-6' id='register' onClick={switchToRegister}>Register</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserAuth;