import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css"; 
import "./UserOrders.css";
import Header from "./Header";


const UserOrders = ({ user }) => {
  const [orders, setOrders] = useState([]); // still keep this as an array

  useEffect(() => {
    if (!user?.username) return;
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/orders?customer=${encodeURIComponent(user.username)}`
        );
        setOrders(res.data.data);
      } catch (err) {
        console.error("Error fetching user orders:", err);
      }
    };
    fetchOrders();
  }, [user]);

  return (
    <>
    <Header />
    <div className="user-orders">
      <h2>Your Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="user-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.product_name}</td>
                <td>{order.quantity}</td>
                <td>{order.payment}</td>
                <td className={order.status === "Completed" ? "completed" : "pending"}>
                  {order.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </>
  );
};

export default UserOrders;
