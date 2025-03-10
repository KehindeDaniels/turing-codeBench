// src/App.jsx
import React, { useRef, useState } from "react";
import ProductSearch from "./components/ProductSearch";
import Cart from "./components/Cart";
import ProductList from "./components/ProductList";
import { useUser } from "./context/UserContext";

function App() {
  const inputRef = useRef(null);
  const [cart, setCart] = useState([]);

  console.log("Search input value:", inputRef.current?.value);

  const user = useUser();

  const addToCart = (product) => {
    setCart([...cart, product]);
    console.log("Added to cart:", product);
  };

  return (
    <div>
      <h1>Welcome to ShopMaster {user}</h1>
      <ProductSearch />
      <ProductList addToCart={addToCart} />
      <Cart cart={cart} />
    </div>
  );
}

export default App;