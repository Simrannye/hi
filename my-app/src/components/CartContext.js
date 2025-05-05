// CartContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart items from backend on first render
  useEffect(() => {
    fetchCartFromBackend();
  }, []);

  const fetchCartFromBackend = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cart", {
        withCredentials: true,
      });
      setCartItems(res.data); // assuming res.data is array of items
    } catch (err) {
      console.error("🔴 Failed to load cart from backend:", err);
    }
  };

  // Add or update product in cart (syncs with backend)
  const addToCart = async (product, quantity = 1) => {
    try {
      // Update local state
      setCartItems(prev => {
        const existingItem = prev.find(item => item.id === product.id);
        if (existingItem) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { ...product, quantity }];
      });

      // Update backend
      await axios.post(
        "http://localhost:5000/api/cart",
        {
          product_id: product.id,
          quantity
        },
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("🔴 Error adding to cart:", err);
    }
  };

  // Remove item from cart (syncs with backend)
  const removeFromCart = async (id) => {
    try {
      setCartItems(prev => prev.filter(item => item.id !== id));
      await axios.delete(`http://localhost:5000/api/cart/${id}`, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("🔴 Error removing from cart:", err);
    }
  };

  // Clear cart locally (optional backend clearing could be added)
  const clearCart = () => {
    setCartItems([]);
  };

  // Count total quantity of items in cart
  const getCartCount = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate total cost
  const getCartTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getCartCount,
        getCartTotal,
        fetchCartFromBackend
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
