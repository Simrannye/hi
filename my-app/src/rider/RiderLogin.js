import React, { useState } from "react";
import { FaMotorcycle, FaLock } from "react-icons/fa";
import "./Riderlogin.css";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";





const RiderLogin = ({ setRiderId }) => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    id: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/riders/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Login success - save rider ID and redirect to rider panel
      localStorage.setItem("riderId", data.id);
      setRiderId(data.id);
      navigate("/rider-dashboard");
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };


  const [showPassword, setShowPassword] = useState(false); 

  return (
    <div className="rider-login-container">
      <div className="rider-login-form">
        <div className="rider-login-header">
          <FaMotorcycle size={40} />
          <h2>Rider Login</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
        <div className="form-group">
  <label>Rider ID</label>
  <input
    type="number"
    name="id"
    value={loginData.id}
    onChange={handleChange}
    placeholder="Enter your Rider ID"
    required
  />
</div>


<div className="form-group">
  <label>Password</label>
  <div className="password-input" style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      value={loginData.password}
      onChange={handleChange}
      placeholder="Enter your password"
      required
      style={{ paddingRight: "40px" }}
    />
    <span
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        color: "#666"
      }}
    >
      {showPassword ? <FaEyeSlash /> : <FaEye />}
    </span>
  </div>
</div>



          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderLogin;