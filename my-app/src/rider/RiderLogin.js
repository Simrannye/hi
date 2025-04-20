import React, { useState } from "react";
import RiderPanel from "./RiderPanel";

const RiderLogin = () => {
  const [riderId, setRiderId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (riderId.trim() !== "") {
      setLoggedIn(true);
    }
  };

  return (
    <div className="rider-login">
      {!loggedIn ? (
        <form onSubmit={handleLogin}>
          <h2>Rider Login</h2>
          <input
            type="text"
            placeholder="Enter Rider ID"
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <RiderPanel riderId={riderId} />
      )}
    </div>
  );
};

export default RiderLogin;
