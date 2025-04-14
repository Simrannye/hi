router.get("/api/orders", async (req, res) => {
    try {
      const { customer, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
  
      let query = "SELECT * FROM orders";
      let countQuery = "SELECT COUNT(*) AS total FROM orders";
      const params = [];
      const countParams = [];
  
      if (customer) {
        query += " WHERE customer = ?";
        countQuery += " WHERE customer = ?";
        params.push(customer);
        countParams.push(customer);
      }
  
      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), offset);
  
      const [rows] = await db.query(query, params);
      const [[countResult]] = await db.query(countQuery, countParams);
  
      res.json({
        data: rows,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  