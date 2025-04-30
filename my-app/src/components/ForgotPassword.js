import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";


function ForgotPassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState('request'); // 'request', 'verification', 'reset'
    const navigate = useNavigate();
    const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    
    // Verification and reset state
    const [verificationData, setVerificationData] = useState({
        userId: null,
        verificationCode: '',
        email: ''
    });
    
    const [newPassword, setNewPassword] = useState({
        password: '',
        confirmPassword: ''
    });
    
    // Handle email input change
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };
    
    // Handle verification code input change
    const handleVerificationChange = (e) => {
        setVerificationData({
            ...verificationData,
            verificationCode: e.target.value
        });
    };
    
    // Handle password input change
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setNewPassword({
            ...newPassword,
            [name]: value
        });
    };
    
    // Handle request password reset
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            // Set verification data
            setVerificationData({
                userId: data.userId,
                verificationCode: '',
                email: email
            });
            
            // Show verification step
            setStep('verification');
            setSuccess('A verification code has been sent to your email.');
            
            // Reset form
            setEmail('');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle verification form submission
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/verify-reset-code', {
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
            
            // Move to reset password step
            setStep('reset');
            setSuccess('Code verified. You can now reset your password.');
            
            // Reset verification form
            setVerificationData({
                ...verificationData,
                verificationCode: ''
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle password reset submission
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Check if passwords match
        if (newPassword.password !== newPassword.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: verificationData.userId,
                    password: newPassword.password
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }
            
            // Show success and redirect to login after a delay
            setSuccess('Password reset successful! Redirecting to login...');
            
            setTimeout(() => {
                navigate('/userauth');
            }, 2000);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle resend verification code
    const handleResendCode = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/resend-reset-code', {
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
            setSuccess('Verification code sent to your email.');
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Go back to login handler
    const switchToLogin = () => {
        navigate('/userauth');
    };

    return (
        <div id="user-auth-container">
            <div id="blur-overlay"></div>
            <div className="content justify-content-center align-items-center d-flex shadow-lg">
                {/* Left side form */}
                <div className="col-md-6 d-flex justify-content-center">
                    {step === 'request' && (
                        <form onSubmit={handleRequestReset}>
                            <div className="header-text mb-4">
                                <h1>Forgot Password</h1>
                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}
                            </div>
                            <p className="text-center mb-4">Enter your email address and we'll send you a verification code to reset your password.</p>
                            <div className="input-group mb-3">
                                <input 
                                    type="email" 
                                    placeholder="Email" 
                                    className="form-control"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                />
                            </div>
                            
                            <div className="input-group mb-3 justify-content-center">
                                <button 
                                    type="submit" 
                                    className="btn border-white text-white w-50 fs-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send Code'}
                                </button>
                            </div>
                            <div className="d-flex justify-content-center mt-3">
                                <button 
                                    type="button" 
                                    className="btn btn-link"
                                    onClick={switchToLogin}
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {step === 'verification' && (
                        <form onSubmit={handleVerifyCode}>
                            <div className="header-text mb-4">
                                <h1>Verify Code</h1>
                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}
                            </div>
                            <p className="text-center mb-4">Enter the verification code sent to your email.</p>
                            <div className="input-group mb-3">
                                <input 
                                    type="text" 
                                    placeholder="Verification Code" 
                                    className="form-control"
                                    value={verificationData.verificationCode}
                                    onChange={handleVerificationChange}
                                    required
                                />
                            </div>
                            
                            <div className="input-group mb-3 justify-content-center">
                                <button 
                                    type="submit" 
                                    className="btn border-white text-white w-50 fs-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </div>
                            <div className="d-flex justify-content-center">
                                <button 
                                    type="button" 
                                    className="btn btn-link"
                                    onClick={handleResendCode}
                                    disabled={isLoading}
                                >
                                    Resend verification code
                                </button>
                            </div>
                            <div className="d-flex justify-content-center mt-2">
                                <button 
                                    type="button" 
                                    className="btn btn-link"
                                    onClick={switchToLogin}
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword}>
                            <div className="header-text mb-4">
                                <h1>Reset Password</h1>
                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}
                            </div>
                            <p className="text-center mb-4">Enter your new password.</p>
                            <div className="input-group mb-3 position-relative">
  <input 
    type={showNewPassword ? "text" : "password"} 
    name="password"
    placeholder="New Password" 
    className="form-control"
    value={newPassword.password}
    onChange={handlePasswordChange}
    required
    style={{ paddingRight: "40px" }}
  />
  <span
    onClick={() => setShowNewPassword(!showNewPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#999"
    }}
  >
    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>

<div className="input-group mb-3 position-relative">
  <input 
    type={showConfirmPassword ? "text" : "password"} 
    name="confirmPassword"
    placeholder="Confirm Password" 
    className="form-control"
    value={newPassword.confirmPassword}
    onChange={handlePasswordChange}
    required
    style={{ paddingRight: "40px" }}
  />
  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#999"
    }}
  >
    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
  </span>
</div>

                            
                            <div className="input-group mb-3 justify-content-center">
                                <button 
                                    type="submit" 
                                    className="btn border-white text-white w-50 fs-6"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                            <div className="d-flex justify-content-center mt-3">
                                <button 
                                    type="button" 
                                    className="btn btn-link"
                                    onClick={switchToLogin}
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                

            </div>
        </div>
    );
}

export default ForgotPassword;