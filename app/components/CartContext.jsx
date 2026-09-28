"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  /* 🔄 Charger depuis localStorage (avec expiration 24h) */
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const lastActivity = localStorage.getItem("cartLastActivity");

    if (!savedCart) return;
    const cartData = JSON.parse(savedCart);
    if (!Array.isArray(cartData) || cartData.length === 0) return;

    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("cart");
        localStorage.removeItem("cartLastActivity");
        return;
      }
    }

    // localStorage n'existe pas côté serveur : l'hydratation doit se faire après le montage
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartItems(cartData);
  }, []);

  /* 💾 Sauvegarde auto + mise à jour horodatage */
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    if (cartItems.length > 0) {
      localStorage.setItem("cartLastActivity", Date.now().toString());
    }
  }, [cartItems]);

  /* ➕ Ajouter au panier */
  const addToCart = useCallback((product) => {
    const cartKey = `${product._id}_${product.size || ""}_${product.color || ""}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);

      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, cartKey, quantity: 1 }];
    });
  }, []);

  /* ➕ Quantité */
  const increaseQty = useCallback((cartKey) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  /* ➖ Quantité */
  const decreaseQty = useCallback((cartKey) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      )
    );
  }, []);

  /* ❌ Supprimer */
  const removeFromCart = useCallback((cartKey) => {
    setCartItems((prev) =>
      prev.filter((item) => item.cartKey !== cartKey)
    );
  }, []);

  /* 🗑️ Vider le panier */
  const clearCart = useCallback(() => setCartItems([]), []);

  /* 💰 TOTAL AUTOMATIQUE */
  const cartTotal = cartItems.reduce((total, item) => {
    const price = Number(item.promoPrice ?? item.price);
    return total + price * item.quantity;
  }, 0);

  // Valeur stable tant que le panier ne change pas : les consommateurs ne se re-rendent pas pour rien
  const value = useMemo(
    () => ({ cartItems, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart, cartTotal }),
    [cartItems, addToCart, increaseQty, decreaseQty, removeFromCart, clearCart, cartTotal]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
