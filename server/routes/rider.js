// routes/rider.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a database configuration

// Get rider information
router.get('/riders/:id', async (req, res) => {
  try {
    const riderId = req.params.id;
    const query = 'SELECT * FROM riders WHERE id = ?';
    
    db.query(query, [riderId], (err, results) => {
      if (err) {
        console.error('Error fetching rider:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Rider not found' });
      }
      
      res.json(results[0]);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders assigned to a specific rider
router.get('/riders/:id/orders', async (req, res) => {
  try {
    const riderId = req.params.id;
    const query = `
      SELECT o.*, p.name as product_name, c.phone, c.address 
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.rider_id = ?
      ORDER BY 
        CASE 
          WHEN o.status = 'Picked Up' THEN 1
          WHEN o.status = 'Assigned' THEN 2
          WHEN o.status = 'Pending' THEN 3
          ELSE 4
        END,
        o.created_at DESC
    `;
    
    db.query(query, [riderId], (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, riderId } = req.body;
    
    // Validate status
    const validStatuses = ['Assigned', 'Picked Up', 'Completed', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const query = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? AND rider_id = ?';
    
    db.query(query, [status, orderId, riderId], (err, result) => {
      if (err) {
        console.error('Error updating order:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found or not assigned to this rider' });
      }
      
      res.json({ message: `Order status updated to ${status}` });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notifications for a rider
router.get('/riders/:id/notifications', async (req, res) => {
  try {
    const riderId = req.params.id;
    const query = `
      SELECT * FROM notifications 
      WHERE rider_id = ? AND is_read = 0
      ORDER BY created_at DESC
    `;
    
    db.query(query, [riderId], (err, results) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(results);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const query = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
    
    db.query(query, [notificationId], (err, result) => {
      if (err) {
        console.error('Error updating notification:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'Notification marked as read' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;