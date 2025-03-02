import React, { useState } from 'react';
import './Products.css'; 

const Product = () => {
  const [productQuantities, setProductQuantities] = useState({
    product1: 1,
    product2: 1,
    product3: 1,
    product4: 1,
    product5: 1,
  });

  const increaseQuantity = (productId) => {
    setProductQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: prevQuantities[productId] + 1,
    }));
  };

  const decreaseQuantity = (productId) => {
    setProductQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: Math.max(1, prevQuantities[productId] - 1),
    }));
  };

  return (
    <div className="product-container">
      <nav className="sidebar">
        <div className="searchbar">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="categories">
          <h3>Categories</h3>
          <ul>
            <li><a href="#">Fruits</a></li>
            <li><a href="#">Vegetables</a></li>
          </ul>
        </div>
        <div>
          <a href="index.html" className="btn">Back</a>
        </div>
      </nav>

      <main>
        <header>
          <h1>Products</h1>
        </header>
        <section className="products">
          {[
            { id: 'product1', name: 'Tomato', price: 'NRs 120 per kg', imgSrc: 'img-1.jpg' },
            { id: 'product2', name: 'Potato', price: 'NRs 120 per kg', imgSrc: 'img-2.jpg' },
            { id: 'product3', name: 'Apple', price: 'NRs 120 per kg', imgSrc: 'img-3.jpg' },
            { id: 'product4', name: 'Mango', price: 'NRs 120 per kg', imgSrc: 'img-4.jpg' },
            { id: 'product5', name: 'Brinjal', price: 'NRs 110 per kg', imgSrc: 'img-5.jpg' }
          ].map((product) => (
            <div className="product" key={product.id} id={product.id}>
              <img src={product.imgSrc} alt={product.name} />
              <h2>{product.name}</h2>
              <p className="price">{product.price}</p>
              <p>Quantity: <span id={`${product.id}Quantity`}>{productQuantities[product.id]}</span> kg</p>
              <button className="increase-btn" onClick={() => increaseQuantity(product.id)}>+</button>
              <button className="decrease-btn" onClick={() => decreaseQuantity(product.id)}>-</button>
              <button className="add-to-cart">Add to Cart</button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Product;
