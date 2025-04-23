import React, { useState, useEffect } from "react";
import { FaMotorcycle, FaBox, FaCheckCircle, FaMapMarkerAlt, FaPhoneAlt, FaMoneyBillWave, FaClipboardCheck } from "react-icons/fa";
import "./Rider.css";

const RiderPanel = ({ riderId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [riderInfo, setRiderInfo] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Fetch rider info
    const fetchRiderInfo = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/riders/${riderId}`);
        if (!response.ok) throw new Error("Failed to fetch rider info");
        const data = await response.json();
        setRiderInfo(data);
      } catch (error) {
        console.error("Error fetching rider info:", error);
      }
    };

    // Fetch rider's orders
    const fetchRiderOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/riders/${riderId}/orders`);
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiderInfo();
    fetchRiderOrders();

    // Set up polling for new orders (every 30 seconds)
    const intervalId = setInterval(fetchRiderOrders, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [riderId]);

  // Handle updating order status
  const updateOrderStatus = async (orderId, status) => {
    const riderId = localStorage.getItem("riderId");

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔥 Important for sending cookies (session-based auth)
        body: JSON.stringify({
          status,
          riderId
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status");
      }
  
      // ✅ Update local UI state
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        )
      );
  
      setNotification({
        message: `Order #${orderId} has been marked as ${status}`,
        type: "success"
      });
  
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating order status:", error);
      setNotification({
        message: `Failed to update order: ${error.message}`,
        type: "error"
      });
    }
  };
  

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "pending") {
      return order.status === "Assigned" || order.status === "Pending";
    } else if (activeTab === "picked") {
      return order.status === "Picked Up";
    } else if (activeTab === "delivered") {
      return order.status === "Completed" || order.status === "Delivered";
    }
    return false;
  });

  if (loading) {
    return <div className="loading">Loading rider orders...</div>;
  }

  return (
    <div className="rider-panel">
      {/* Rider Header */}
      <div className="rider-header">
        <div className="rider-icon">
          <FaMotorcycle size={32} />
        </div>
        <div className="rider-info">
          <h2>Rider Dashboard</h2>
          {riderInfo && (
            <p>Welcome, {riderInfo.name} | ID: {riderId}</p>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === "pending" ? "active" : ""} 
          onClick={() => setActiveTab("pending")}
        >
          Pending Orders
        </button>
        <button 
          className={activeTab === "picked" ? "active" : ""} 
          onClick={() => setActiveTab("picked")}
        >
          Picked Up Orders
        </button>
        <button 
          className={activeTab === "delivered" ? "active" : ""} 
          onClick={() => setActiveTab("delivered")}
        >
          Delivered Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <FaBox size={48} />
            <p>No {activeTab} orders at the moment</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <div className="detail-item">
                  <FaBox />
                  <p>Product: {order.product_name}</p>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt />
                  <p>Address: {order.address || "Not specified"}</p>
                </div>
                <div className="detail-item">
                  <FaPhoneAlt />
                  <p>Contact: {order.phone || "Not specified"}</p>
                </div>
                <div className="detail-item">
                  <FaMoneyBillWave />
                  <p>Payment: {order.payment}</p>
                </div>
              </div>
              
              <div className="order-actions">
                {(order.status === "Assigned" || order.status === "Pending") && (
                  <button 
                    className="action-btn pickup-btn"
                    onClick={() => updateOrderStatus(order.id, "Picked Up")}
                  >
                    Mark as Picked Up
                  </button>
                )}
                
                {order.status === "Picked Up" && (
                  <button 
                    className="action-btn delivered-btn"
                    onClick={() => updateOrderStatus(order.id, "Completed")}
                  >
                    Mark as Delivered
                  </button>
                )}
                
                {(order.status === "Completed" || order.status === "Delivered") && (
                  <div className="delivered-info">
                    <FaCheckCircle size={16} />
                    <span>Delivered Successfully</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Order Summary */}
      <div className="order-summary">
        <div className="summary-card">
          <FaClipboardCheck />
          <div>
            <h4>Total Orders</h4>
            <p>{orders.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <FaBox />
          <div>
            <h4>Pending</h4>
            <p>{orders.filter(o => o.status === "Assigned" || o.status === "Pending").length}</p>
          </div>
        </div>
        <div className="summary-card">
          <FaMotorcycle />
          <div>
            <h4>In Transit</h4>
            <p>{orders.filter(o => o.status === "Picked Up").length}</p>
          </div>
        </div>
        <div className="summary-card">
          <FaCheckCircle />
          <div>
            <h4>Delivered</h4>
            <p>{orders.filter(o => o.status === "Completed" || o.status === "Delivered").length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderPanel;