import React, { useState } from "react";
import "./UserSetting.css"; // Make sure you have the CSS file
import profilePlaceholder from "../profile.jpg"; // Update with the correct path
import Header from "./Header";
const UserSettings = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profilePic, setProfilePic] = useState(profilePlaceholder);

  // Handle file selection for profile picture preview
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file));
    }
  };

  return (
    <>
     <Header />
    <div className="settings-container">
   

      {/* Profile Settings Section */}
      <section className="settings">
        <h2>Profile Settings</h2>
        <form action="/update-profile" method="POST">
          {/* Profile Picture Upload */}
          <label>Profile Picture:</label>
          <img src={profilePic} alt="Profile" id="existingProfilePic" className="profile-image" />
          <br />
          <label htmlFor="profilePicture" className="custom-file-upload">
            Choose New Picture
          </label>
          <input type="file" id="profilePicture" name="profilePicture" accept="image/*" onChange={handleProfilePictureChange} />

          {/* Name Input */}
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" placeholder="Enter your name" required />

          {/* Email Input */}
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />

          {/* Phone Input */}
          <label htmlFor="phone">Phone Number:</label>
          <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" />

          {/* Address Input */}
          <label htmlFor="address">Address:</label>
          <textarea id="address" name="address" placeholder="Enter your address"></textarea>

          {/* Change Password Section */}
          <div className="password-section">
            <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              Change Password
            </button>

            {/* Password Form (conditionally rendered) */}
            {showPasswordForm && (
              <div className="password-form">
                <label htmlFor="currentPassword">Current Password:</label>
                <input type="password" id="currentPassword" placeholder="Enter current password" />

                <label htmlFor="newPassword">New Password:</label>
                <input type="password" id="newPassword" placeholder="Enter new password" />

                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <input type="password" id="confirmPassword" placeholder="Confirm new password" />

                <div className="password-actions">
                  <button type="button" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </button>
                  <button type="submit">Update Password</button>
                </div>
              </div>
            )}
          </div>

          {/* Update Profile Button */}
          <button type="submit">Update Profile</button>
        </form>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; 2024 GrabnGo - All rights reserved</p>
      </footer>
    </div></>
   
  );
};

export default UserSettings;
