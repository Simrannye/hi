import React, { useEffect, useState } from "react";
import axios from "axios";

const RiderPanel = ({ riderId }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchRiderOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/rider/orders/${riderId}`);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch rider orders:", err);
      }
    };

    fetchRiderOrders();
  }, [riderId]);

  const handleDeliver = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/rider/orders/${orderId}/deliver`);
      setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: "Delivered" } : order));
    } catch (err) {
      console.error("Failed to mark as delivered:", err);
    }
  };

  return (
    <div>
      <h2>Rider Dashboard - ID: {riderId}</h2>
      <ul>
        {orders.map(order => (
          <li key={order._id}>
            <p><strong>Customer:</strong> {order.customerName}</p>
            <p><strong>Address:</strong> {order.deliveryAddress}</p>
            <p><strong>Status:</strong> {order.status}</p>
            {order.status !== "Delivered" && (
              <button onClick={() => handleDeliver(order._id)}>Mark as Delivered</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiderPanel;
