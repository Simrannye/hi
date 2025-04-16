import React, { useEffect, useState } from "react";
import "./UserSetting.css";
import Header from "./Header";
import axios from "axios";

const UserSetting = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    phone: "",
    address: ""
  });

  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState("");
  

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/status", {
          withCredentials: true
        });
  
        if (res.data.authenticated) {
          // ✅ Destructure all fields from backend response
          const { username, email, phone, address } = res.data.user;
  
          // ✅ Update all fields in state
          setUserData({ username, email, phone, address });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
  
    fetchUser();
  }, []);
  

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/update-profile",
        userData,
        { withCredentials: true }
      );

      if (res.data.success) {
        setMessage("Profile updated successfully!");
      } else {
        setMessage("Update failed.");
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Server error.");
    }
  };

  return (
    <>
      <Header />
      <div className="settings-container">
        <section className="settings">
          <h1>Profile Settings</h1>
          {message && <div className="alert-msg">{message}</div>}

          <form onSubmit={handleSubmit}>
            {/* Profile image or initials */}
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="profile-image" />
            ) : (
              <div className="initials-avatar">
                {getInitials(userData.username)}
              </div>
            )}

            {/* Upload input
            <label htmlFor="profilePicture" className="custom-file-upload">
              Choose New Picture
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleProfilePictureChange}
            /> */}

            {/* Username */}
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              name="username"
              id="username"
              value={userData.username}
              onChange={handleChange}
              required
            />

            {/* Email */}
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              name="email"
              id="email"
              value={userData.email}
              onChange={handleChange}
              required
            />

            {/* Phone */}
            <label htmlFor="phone">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={userData.phone}
              onChange={handleChange}
            />

            {/* Address */}
            <label htmlFor="address">Address:</label>
            <textarea
              name="address"
              id="address"
              value={userData.address}
              onChange={handleChange}
            ></textarea>

            {/* Submit */}
            <button type="submit" className="submit">Update Profile</button>
          </form>
        </section>
      </div>
    </>
  );
};

export default UserSetting;
