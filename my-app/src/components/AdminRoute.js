import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const [isAllowed, setIsAllowed] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/status', {
          credentials: 'include'
        });
        const data = await res.json();

        if (data.authenticated && data.user.role === 'admin') {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      } catch (err) {
        setIsAllowed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (isLoading) {
    return <div className="text-center mt-5">Checking permissions...</div>;
  }

  return isAllowed ? children : <Navigate to="/" state={{ from: location }} replace />;
};

export default AdminRoute;
