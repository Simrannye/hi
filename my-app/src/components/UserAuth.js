import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';

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
    
    // Verification state
    const [verificationStep, setVerificationStep] = useState(false);
    const [verificationData, setVerificationData] = useState({
        userId: null,
        verificationCode: '',
        email: ''
    });
    
    // Error and loading states
    const [registerError, setRegisterError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    const switchToRegister = () => {
        setIsActive(true);
        setLoginError('');
    };

    const switchToLogin = () => {
        setIsActive(false);
        setRegisterError('');
        setVerificationStep(false);
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
    
    // Handle verification code input
    const handleVerificationChange = (e) => {
        setVerificationData({
            ...verificationData,
            verificationCode: e.target.value
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
            
            // Set verification data
            setVerificationData({
                userId: data.userId,
                verificationCode: '',
                email: registerData.email
            });
            
            // Show verification step
            setVerificationStep(true);
            setRegisterSuccess(true);
            
            // Reset form
            setRegisterData({
                username: '',
                email: '',
                password: ''
            });
            setTimeout(() => {
                setRegisterSuccess(false);
            }, 4000);
        } catch (error) {
            setRegisterError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle verification form submission
    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setVerificationError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: verificationData.userId,
                    verificationCode: verificationData.verificationCode
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }
            
            // Show verification success
            setVerificationSuccess(true);
            
            // Reset verification form
            setVerificationData({
                ...verificationData,
                verificationCode: ''
            });
            
            // Switch to login after 3 seconds
            setTimeout(() => {
                setVerificationStep(false);
                setIsActive(false);
                setVerificationSuccess(false);
            }, 1500);
        } catch (error) {
            setVerificationError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle resend verification code
    const handleResendCode = async () => {
        setIsLoading(true);
        setVerificationError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: verificationData.email
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend verification code');
            }
            
            // Update user ID in case it changed
            setVerificationData({
                ...verificationData,
                userId: data.userId
            });
            
            // Show success message
            setRegisterSuccess(true);
            setTimeout(() => {
                setRegisterSuccess(false);
            }, 3000);
        } catch (error) {
            setVerificationError(error.message);
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Check if verification is required
                if (response.status === 403 && data.requiresVerification) {
                    // Set verification data and switch to verification step
                    setVerificationData({
                        userId: data.userId,
                        verificationCode: '',
                        email: loginData.email
                    });
                    setVerificationStep(true);
                    setIsActive(true);
                    throw new Error('Please verify your email before logging in');
                }
                
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
        <div id="user-auth-container">
            <div id="blur-overlay"></div>
            <div className={`content justify-content-center align-items-center d-flex shadow-lg ${isActive ? "active" : ""}`} id='content'>
                {/* Registration */}
                <div className='col-md-6 d-flex justify-content-center'>
                    {!verificationStep ? (
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="header-text mb-4">
                                <h1>Create Account</h1>
                                {registerError && <div className="alert alert-danger">{registerError}</div>}
                                {registerSuccess && <div className="alert alert-success">Registration successful! Please check your email for verification code.</div>}
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
                    ) : (
                        <form onSubmit={handleVerificationSubmit}>
                            <div className="header-text mb-4">
                                <h1>Verify Your Email</h1>
                                {verificationError && <div className="alert alert-danger">{verificationError}</div>}
                                {verificationSuccess && <div className="alert alert-success">Email verified successfully! You can now log in.</div>}
                                {registerSuccess && <div className="alert alert-success">Verification code sent to your email.</div>}
                            </div>
                            <p className="text-center mb-4">We've sent a verification code to your email. Please enter it below to activate your account.</p>
                            <div className='input-group mb-3'>
                                <input 
                                    type='text' 
                                    placeholder='Verification Code' 
                                    className='form-control'
                                    value={verificationData.verificationCode}
                                    onChange={handleVerificationChange}
                                    required
                                />
                            </div>
                            
                            <div className='input-group mb-3 justify-content-center'>
                                <button 
                                    type="submit" 
                                    className='btn border-white text-white w-50 fs-6'
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                            <div className='d-flex justify-content-center'>
                                <button 
                                    type="button" 
                                    className='btn btn-link'
                                    onClick={handleResendCode}
                                    disabled={isLoading}
                                >
                                    Resend verification code
                                </button>
                            </div>
                            <div className='d-flex justify-content-center mt-2'>
                                <button 
                                    type="button" 
                                    className='btn btn-link'
                                    onClick={switchToLogin}
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Login */}
                <div className='col-md-6 right-box'>
                    <form onSubmit={handleLoginSubmit}>
                        <div className="header-text mb-4">
                        {verificationSuccess && <div className="alert alert-success">Email verified successfully! You can now log in.</div>}
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
                                <small><a href='/forgot'>Forgot Password?</a></small>
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
                            <h1>Have an account?</h1>
                            <p>We would be happy to see you back</p>
                            <button className='hidden btn border-white text-white w-50 fs-6' id='login' onClick={switchToLogin}>Login</button>
                        </div>
                        <div className='switch-panel switch-right'>
                            <h1>No account yet?</h1>
                            <p>Join GrabNGo, and Stay Healthy!</p>
                            <button className='hidden btn border-white text-white w-50 fs-6' id='register' onClick={switchToRegister}>Register</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserAuth;