
import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (producto, cantidad, stock) => {
    const existente = cart.find(
      (item) => item.producto === producto.producto
    );

    const cantidadActual = existente ? existente.cantidad : 0;
    const nuevaCantidad = cantidadActual + cantidad;

    if (nuevaCantidad > 4) {
      return {
        ok: false,
        mensaje: 'El máximo permitido es de 4 unidades por producto.',
      };
    }

    if (nuevaCantidad > stock) {
      return {
        ok: false,
        mensaje: 'No hay suficientes existencias disponibles.',
      };
    }

    if (existente) {
      setCart((actual) =>
        actual.map((item) =>
          item.producto === producto.producto
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      );
    } else {
      setCart((actual) => [
        ...actual,
        { ...producto, cantidad },
      ]);
    }

    return { ok: true };
  };

  const updateQuantity = (producto, cantidad) => {
    if (cantidad < 1 || cantidad > 4) return;

    setCart((actual) =>
      actual.map((item) =>
        item.producto === producto
          ? { ...item, cantidad }
          : item
      )
    );
  };

  const removeFromCart = (producto) => {
    setCart((actual) =>
      actual.filter((item) => item.producto !== producto)
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (suma, item) => suma + item.precio * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe utilizarse dentro de CartProvider.');
  }

  return context;
}
