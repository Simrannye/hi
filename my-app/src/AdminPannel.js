import React, { useState, useEffect } from "react";
import { FaBox, FaClipboardList, FaClock, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";
import "./AdminPannel.css";
import AdminNavbar from "./components/AdminNavbar";
import "./components/AdminNavbar.css";


const AdminPannel = ({ setUser }) => {

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", price: "", category: "", description: "", instock: 0, location: "", imageFile: null });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingRider, setEditingRider] = useState(null);
  const [riders, setRiders] = useState([]);

  const [newRider, setNewRider] = useState({
    name: "",
    address: "",
    phone: "",
    password: "",
    });


  // Fetch products from the backend
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchMessages();
    fetchRiders();

    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  

  }, []);
  const [messages, setMessages] = useState([]);



  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      console.log("Fetched Products:", data); // Debugging log
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
  
      const data = await response.json();
      console.log("Fetched Orders:", data);
  
      setOrders(data.data); 
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  

  const fetchRiders = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/riders");
      const data = await response.json();
      setRiders(data);
    } catch (error) {
      console.error("Error fetching riders:", error);
    }
  };
  
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRider((prev) => ({ ...prev, [name]: value }));
    setForm({
      ...form,
      [name]: name === "instock" ? Number(value) || 0 : value || "",

    });
  };


//adding rider

  const handleSaveRider = async () => {
    try {
      const method = editingRider ? "PUT" : "POST";
      const url = editingRider
        ? `http://localhost:5000/api/riders/${editingRider.id}`
        : "http://localhost:5000/api/riders";
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRider),
      });
  
      if (!response.ok) throw new Error("Save failed");
  
      await fetchRiders(); // Refresh list
      setNewRider({ name: "", address: "", phone: "", password: "" });
      setEditingRider(null);
    } catch (error) {
      console.error("Error saving rider:", error);
    }
  };
  

  //deleting rider

  const handleDeleteRider = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rider?")) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/riders/${id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) throw new Error("Delete failed");
  
      fetchRiders(); // Refresh list
    } catch (error) {
      console.error("Error deleting rider:", error);
    }
  };

  //table and form

  const renderRiders = () => {
    return (
      <>
        <h3 className="admin-subheading">Riders List</h3>
  
        {/* Form */}
        <div className="riders-form">
<input
  name="name"
  placeholder="Name"
  value={editingRider ? newRider.name : ""}
  onChange={handleInputChange}
/>

<input
  name="address"
  placeholder="Address"
  value={editingRider ? newRider.address : ""}
  onChange={handleInputChange}
/>

<input
  name="phone"
  placeholder="Phone"
  value={editingRider ? newRider.phone : ""}
  onChange={handleInputChange}
/>

<input
  className="rider-input"
  type="password"
  name="password"
  autoComplete="new-password"
  placeholder="Password"
  value={newRider.password}
  onChange={handleInputChange}
/>



          <button onClick={handleSaveRider}>
            {editingRider ? "Update Rider" : "Add Rider"}
          </button>
          {editingRider && (
            <button onClick={() => {
              setEditingRider(null);
              setNewRider({ name: "", address: "", phone: "", password: "" });
            }}>Cancel</button>
          )}
        </div>
  
        {/* Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.id}</td>
                  <td>{rider.name}</td>
                  <td>{rider.address}</td>
                  <td>{rider.phone}</td>
                  <td>{rider.password}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingRider(rider);
                        setNewRider({
                          name: rider.name,
                          address: rider.address,
                          phone: rider.phone,
                          password: rider.password,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteRider(rider.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };
//assign riders


const assignOrderToRider = async (orderId, riderId) => {
  try {
    const response = await fetch("http://localhost:5000/api/riders/assign-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        orderId, 
        riderId,
        // Add additional fields needed for notification
        notificationText: `New delivery assigned: Order #${orderId}`,
        notificationType: "assignment"
      }),
    });

    if (!response.ok) throw new Error("Failed to assign order");

    // Find rider name for immediate update
    const selectedRider = riders.find((r) => r.id === parseInt(riderId));

    // Update the local orders state
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              rider_name: selectedRider?.name || "Assigned",
              rider_id: riderId,
              status: "Assigned", // immediate visual update
            }
          : order
      )
    );
  } catch (error) {
    console.error("Error assigning rider:", error);
  }
};


    

  // Add product to database
  const addProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("instock", form.instock);
      formData.append("location", form.location);

      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }
  
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: formData
      });
  
      if (!response.ok) throw new Error("Failed to add product");
  
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      setForm({ id: "", name: "", price: "", category: "", description: "", instock: 0, imageFile: null });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };
  

  // Edit product
  const editProduct = (product) => {
    setForm(product);
    setIsEditing(true);
    setActiveTab("products");
  };

  // Update product in database
  const updateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("instock", form.instock);
      formData.append("location", form.location);
      formData.append("oldImage", form.image); // ✅ send old image path
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }
  
      const response = await fetch(`http://localhost:5000/api/products/${form.id}`, {
        method: "PUT",
        body: formData
      });
  
      if (!response.ok) throw new Error("Failed to update product");
  
      await fetchProducts();
      setForm({ id: "", name: "", price: "", category: "", description: "", instock: 0, image: null, imageFile: null });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };
  

  // Delete product from database
  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      setProducts(products.filter((p) => p.id !== id)); // Remove product from state
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "PUT", // Ensure it's a PUT request
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }), // Ensure correct payload
      });

      if (!response.ok) throw new Error("Failed to update order status");

      console.log("Order updated successfully!");
      fetchOrders(); // Refresh orders list after updating
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };


  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/messages");
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const renderMessages = () => {
    return (
      <>
        <h3 className="admin-subheading">Contact Messages</h3>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td>{msg.id}</td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td>{msg.phone}</td>
                  <td>{msg.message}</td>
                  <td>{new Date(msg.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };
  
  
  // Dashboard Statistics
  const getDashboardStats = () => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === "Pending").length;
    const completedOrders = orders.filter(order => order.status === "Completed").length;
    const lowStockProducts = products.filter(product => product.instock < 5).length;
    const totalmsg = messages.length;
    
    // const totalRevenue = orders
    //   .filter(order => order.status === "Completed")
    //   .reduce((sum, order) => {
    //     const product = products.find(p => p.name === order.productname);
    //     return sum + (product ? product.price * order.quantity : 0);
    //   }, 0);
    
    return { totalProducts, totalOrders, pendingOrders, completedOrders, lowStockProducts, totalmsg };
  };

  // Render dashboard
  const renderDashboard = () => {
    const stats = getDashboardStats();
    
    return (
      <div className="dashboard-container">
        <h3 className="admin-subheading">Dashboard Overview</h3>
      <div className="stats-grid">
  <div className="stat-card" onClick={() => setActiveTab("products")} style={{ cursor: "pointer" }}>
    <FaBox className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.totalProducts}</div>
      <div className="stat-label">Total Products</div>
    </div>
  </div>

  <div className="stat-card" onClick={() => setActiveTab("orders")} style={{ cursor: "pointer" }}>
    <FaClipboardList className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.totalOrders}</div>
      <div className="stat-label">Total Orders</div>
    </div>
  </div>

  <div className="stat-card" onClick={() => setActiveTab("orders")} style={{ cursor: "pointer" }}>
    <FaClock className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.pendingOrders}</div>
      <div className="stat-label">Pending Orders</div>
    </div>
  </div>

  <div className="stat-card" onClick={() => setActiveTab("orders")} style={{ cursor: "pointer" }}>
    <FaCheckCircle className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.completedOrders}</div>
      <div className="stat-label">Completed Orders</div>
    </div>
  </div>

  <div className="stat-card" onClick={() => setActiveTab("products")} style={{ cursor: "pointer" }}>
    <FaExclamationTriangle className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.lowStockProducts}</div>
      <div className="stat-label">Low Stock Items</div>
    </div>
  </div>
<div className="stat-card" onClick={() => setActiveTab("contact_messages")} style={{ cursor: "pointer" }}>
  <FaExclamationTriangle className="stat-icon" />
  <div className="stat-content">
    <div className="stat-value">{stats.totalmsg}</div>
    <div className="stat-label">Total Messages</div>
  </div>
</div>



  {/* <div className="stat-card">
    <FaMoneyBillWave className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">NPR {stats.totalRevenue.toLocaleString()}</div>
      <div className="stat-label">Total Revenue</div>
    </div>
  </div> */}
</div>

        
        <div className="dashboard-actions">
          <button className="admin-btn admin-add-btn" onClick={() => setActiveTab("products")}>
            Manage Products
          </button>
          <button className="admin-btn admin-complete-btn" onClick={() => setActiveTab("orders")}>
            View Orders
          </button>
          <button className="admin-btn admin-message-btn" onClick={() => setActiveTab("contact_messages")}>View Messages</button>

        </div>
      </div>
    );
  };

  // Render product management section
  const renderProducts = () => {
    return (
      <>
        <h3 className="admin-subheading">Product Management</h3>
        
        {/* Product Form */}
        <div className="admin-product-form">
          <input 
            type="text" 
            name="name" 
            placeholder="Product Name" 
            value={form.name || ""}  // Ensure it never becomes undefined
            onChange={handleInputChange} 
          />

          <input 
            type="number" 
            name="price" 
            placeholder="Price" 
            value={form.price || ""}  // Ensure it's always a number
            onChange={handleInputChange} 
          />

          <input 
            type="text" 
            name="category" 
            placeholder="Category" 
            value={form.category || ""} 
            onChange={handleInputChange} 
          />

          <input 
            type="text" 
            name="description" 
            placeholder="Description" 
            value={form.description || ""} 
            onChange={handleInputChange} 
          />

          <input 
            type="number" 
            name="instock" 
            placeholder="Stock" 
            value={form.instock || 0} 
            onChange={handleInputChange} 
          />

<input 
  type="file" 
  name="image" 
  onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
/>

<select 
  name="location" 
  value={form.location || ""} 
  onChange={handleInputChange}
>
  <option value="">Select Location</option>
  <option value="Budhanilkantha">Budhanilkantha</option>
  <option value="Thamel">Thamel</option>
  <option value="Naxal">Naxal</option>
</select>

{/* ✅ Show current image from DB */}
{form.image && !form.imageFile && (
  <img
    src={`http://localhost:5000${form.image}`}
    alt="Current"
    width="80"
    style={{ marginTop: "10px", display: "block" }}
  />
)}

{/* ✅ Show preview of new selected image */}
{form.imageFile && (
  <img
    src={URL.createObjectURL(form.imageFile)}
    alt="Preview"
    width="80"
    style={{ marginTop: "10px", display: "block" }}
  />
)}


          {isEditing ? (
            <button className="admin-btn admin-update-btn" onClick={updateProduct}>Update Product</button>
          ) : (
            <button className="admin-btn admin-add-btn" onClick={addProduct}>Add Product</button>
          )}
        </div>

        {/* Products Table */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Description</th>
                <th>Images</th>
                <th>Stock</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>NPR {product.price}</td>
                  <td>{product.category}</td>
                  <td>{product.description}</td>
                  <td>
  {product.image ? (
    <img src={`http://localhost:5000${product.image}`} alt={product.name} width="50" />
  ) : (
    "No Image"
  )}
</td>

                  <td>{product.instock}</td>
                  <td>{product.location || "—"}</td>
                  <td>
                    <button className="admin-btn admin-edit-btn" onClick={() => editProduct(product)}>Edit</button>
                    <button className="admin-btn admin-delete-btn" onClick={() => deleteProduct(product.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="admin-subheading">Live Product Preview</h3>
<div className="products-preview-grid">
  {products.length === 0 ? (
    <p>No products available.</p>
  ) : (
    products.map((product) => (
      <div className="preview-card" key={product.id}>
        <img
          src={`http://localhost:5000${product.image}`}
          alt={product.name}
          width="100"
        />
        <h4>{product.name}</h4>
        <p>Price: NPR {product.price}</p>
        <p>Stock: {product.instock}</p>
        <p>Location: {product.location || "—"}</p>

        <p className="badge-category">{product.category}</p>
        {product.instock < 5 && (
          <p className="badge-low-stock">Low stock</p>
        )}
        <p className="preview-category">{product.category}</p>
      </div>
    ))
  )}
</div>
        </div>
      </>
    );
  };
  

  // Render orders section
  const renderOrders = () => {
    return (
      <>
        <h3 className="admin-subheading">Order Management</h3>
  
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Payment Method</th>
                <th>Assigned Rider</th>
                <th>Assign</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td>{order.payment}</td>
                  <td>{order.rider_name || "Unassigned"}</td>
                  <td>
                    <select
                      defaultValue=""
                      onChange={(e) => assignOrderToRider(order.id, e.target.value)}
                      className="rider-assign-dropdown"
                    >
                      <option value="" disabled>Select Rider</option>
                      {riders.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={(order.status || "Pending") === "Completed" ? "completed" : "pending"}>
                   {order.status || "Pending"}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };
  

  return (
    <div className="admin-layout">
      <AdminNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setUser={setUser} 
      />
  
      <main className="content-area">
        <div className="admin-panel-container">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "contact_messages" && renderMessages()}
          {activeTab === "riders" && renderRiders()}
        </div>
      </main>
    </div>
  );  
  
};
export default AdminPannel;