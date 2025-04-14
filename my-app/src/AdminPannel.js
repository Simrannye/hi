import React, { useState, useEffect } from "react";
import { FaBox, FaClipboardList, FaClock, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";
import "./AdminPannel.css";
import AdminNavbar from "./components/AdminNavbar";
import "./components/AdminNavbar.css";


const AdminPannel = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", price: "", category: "", description: "", instock: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch products from the backend
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchMessages();

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
  
      setOrders(data.data); // ✅ FIXED
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "instock" ? Number(value) || 0 : value || "",
    });
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
    
    const totalRevenue = orders
      .filter(order => order.status === "Completed")
      .reduce((sum, order) => {
        const product = products.find(p => p.name === order.productname);
        return sum + (product ? product.price * order.quantity : 0);
      }, 0);
    
    return { totalProducts, totalOrders, pendingOrders, completedOrders, lowStockProducts, totalRevenue };
  };

  // Render dashboard
  const renderDashboard = () => {
    const stats = getDashboardStats();
    
    return (
      <div className="dashboard-container">
        <h3 className="admin-subheading">Dashboard Overview</h3>
        <div className="stats-grid">
  <div className="stat-card">
    <FaBox className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.totalProducts}</div>
      <div className="stat-label">Total Products</div>
    </div>
  </div>

  <div className="stat-card">
    <FaClipboardList className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.totalOrders}</div>
      <div className="stat-label">Total Orders</div>
    </div>
  </div>

  <div className="stat-card">
    <FaClock className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.pendingOrders}</div>
      <div className="stat-label">Pending Orders</div>
    </div>
  </div>

  <div className="stat-card">
    <FaCheckCircle className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.completedOrders}</div>
      <div className="stat-label">Completed Orders</div>
    </div>
  </div>

  <div className="stat-card">
    <FaExclamationTriangle className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">{stats.lowStockProducts}</div>
      <div className="stat-label">Low Stock Items</div>
    </div>
  </div>

  <div className="stat-card">
    <FaMoneyBillWave className="stat-icon" />
    <div className="stat-content">
      <div className="stat-value">NPR {stats.totalRevenue.toLocaleString()}</div>
      <div className="stat-label">Total Revenue</div>
    </div>
  </div>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.productname}</td>
                  <td>{order.quantity}</td>
                  <td>{order.payment}</td>
                  <td className={order.status === "Completed" ? "completed" : "pending"}>
                    {order.status}
                  </td>
                  <td>
                    <button className="admin-btn admin-complete-btn" onClick={() => updateOrderStatus(order.id, "Completed")}>
                      Completed
                    </button>
                    <button className="admin-btn admin-pending-btn" onClick={() => updateOrderStatus(order.id, "Pending")}>
                      Pending
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

  return (
    <div className="admin-layout">
      <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} /> {/* outside the panel container */}
  
      <main className="content-area">
        <div className="admin-panel-container">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "contact_messages" && renderMessages()} 

        </div>
      </main>
    </div>
  );
  
  
  
};
export default AdminPannel;