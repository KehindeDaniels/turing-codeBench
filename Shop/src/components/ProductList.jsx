import React from "react";

const products = [
  { id: 1, name: "Laptop", price: "$999" },
  { id: 2, name: "Smartphone", price: "$699" },
  { id: 3, name: "Headphones", price: "$199" },
  { id: 4, name: "Smartwatch", price: "$299" },
];

const ProductList = ({ addToCart }) => {
  return (
    <div>
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - {product.price}
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
