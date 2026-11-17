
import React, {
  createContext,
  useContext,
  useState,
} from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // ============================================
  // AGREGAR PRODUCTO AL CARRITO
  // ============================================

  const addToCart = (producto, cantidad, stock) => {
    // Unificar identificadores: id y producto
    const idProducto = producto.producto || producto.id;

    if (!idProducto) {
      return {
        ok: false,
        mensaje: 'El producto no tiene un identificador válido.',
      };
    }

    const cantidadAgregar = Number(cantidad);
    const stockDisponible = Number(stock);

    if (
      !Number.isFinite(cantidadAgregar) ||
      cantidadAgregar < 1
    ) {
      return {
        ok: false,
        mensaje: 'La cantidad seleccionada no es válida.',
      };
    }

    if (
      !Number.isFinite(stockDisponible) ||
      stockDisponible <= 0
    ) {
      return {
        ok: false,
        mensaje: 'Este producto no tiene existencias disponibles.',
      };
    }

    const existente = cart.find(
      (item) => item.producto === idProducto
    );

    const cantidadActual = existente
      ? Number(existente.cantidad)
      : 0;

    const nuevaCantidad = cantidadActual + cantidadAgregar;

    if (nuevaCantidad > 4) {
      return {
        ok: false,
        mensaje: 'El máximo permitido es de 4 unidades por producto.',
      };
    }

    if (nuevaCantidad > stockDisponible) {
      return {
        ok: false,
        mensaje: `Solamente hay ${stockDisponible} unidades disponibles.`,
      };
    }

    if (existente) {
      setCart((actual) =>
        actual.map((item) =>
          item.producto === idProducto
            ? {
                ...item,
                cantidad: nuevaCantidad,
              }
            : item
        )
      );
    } else {
      setCart((actual) => [
        ...actual,
        {
          ...producto,
          id: idProducto,
          producto: idProducto,
          cantidad: cantidadAgregar,
        },
      ]);
    }

    return {
      ok: true,
      mensaje: 'Producto agregado correctamente.',
    };
  };

  // ============================================
  // ACTUALIZAR CANTIDAD
  // ============================================

  const updateQuantity = (producto, cantidad) => {
    const idProducto = producto;

    const nuevaCantidad = Number(cantidad);

    if (
      !idProducto ||
      !Number.isInteger(nuevaCantidad) ||
      nuevaCantidad < 1 ||
      nuevaCantidad > 4
    ) {
      return;
    }

    setCart((actual) =>
      actual.map((item) =>
        item.producto === idProducto
          ? {
              ...item,
              cantidad: nuevaCantidad,
            }
          : item
      )
    );
  };

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================

  const removeFromCart = (producto) => {
    setCart((actual) =>
      actual.filter(
        (item) => item.producto !== producto
      )
    );
  };

  // ============================================
  // VACIAR CARRITO
  // ============================================

  const clearCart = () => {
    setCart([]);
  };

  // ============================================
  // CALCULAR TOTAL
  // ============================================

  const total = cart.reduce(
    (suma, item) =>
      suma +
      Number(item.precio || 0) *
      Number(item.cantidad || 0),
    0
  );

  // ============================================
  // CANTIDAD TOTAL DE PRODUCTOS
  // ============================================

  const totalProductos = cart.reduce(
    (suma, item) =>
      suma + Number(item.cantidad || 0),
    0
  );

  // ============================================
  // PROVEEDOR DEL CARRITO
  // ============================================

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        totalProductos,
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

// ============================================
// HOOK DEL CARRITO
// ============================================

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart debe utilizarse dentro de CartProvider.'
    );
  }

  return context;
}
