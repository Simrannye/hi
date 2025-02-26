import React, { useState } from "react";
import "./UserSetting.css"; 
import profilePlaceholder from "./profile.jpg"; 
import Header from "./Header";
const UserSettings = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profilePic, setProfilePic] = useState(profilePlaceholder);

 
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
        <h1>Profile Settings</h1>
        <form action="/update-profile" method="POST">
          {/* Profile Picture Upload */}
          
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



          {/* Update Profile Button */}
          <button type="submit" class="submit">Update Profile</button>
        </form>
      </section>

      {/* Footer */}
      {/* <footer>
        <p>&copy; 2024 GrabnGo - All rights reserved</p>
      </footer> */}
    </div></>
   
  );
};

export default UserSettings;
