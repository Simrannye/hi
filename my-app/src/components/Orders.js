import React from 'react';
import './Orders.css';

const Orders = () => {
  const orders = [
    {
      orderNo: '001',
      product: 'Potato',
      totalAmount: 'Npr 250.00',
      deliveryLocation: 'Kathmandu',
      approval: 'Approved',
      deliveryPhase: 'In Transit',
    },
    {
      orderNo: '002',
      product: 'Apple',
      totalAmount: 'Npr 150.00',
      deliveryLocation: 'Kathmandu',
      approval: 'Pending',
      deliveryPhase: 'Processing',
    },
    {
      orderNo: '003',
      product: 'Tomato',
      totalAmount: 'Npr 180.00',
      deliveryLocation: 'Lalitpur',
      approval: 'Approved',
      deliveryPhase: 'Delivered',
    },
    // Add more rows as needed
  ];

  return (
    <main className="main-container">
      <div className="main-title">
        <h1>Orders</h1>
      </div>

      <div className="table-container">
        <table className="order-table">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Product</th>
              <th>Total Amount</th>
              <th>Delivery Location</th>
              <th>Approval</th>
              <th>Delivery Phase</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td>{order.orderNo}</td>
                <td>{order.product}</td>
                <td>{order.totalAmount}</td>
                <td>{order.deliveryLocation}</td>
                <td>{order.approval}</td>
                <td>{order.deliveryPhase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Orders;
