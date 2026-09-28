"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "./CartContext";

export default function Providers({ children }) {
  return (
    // Pas de relecture de /api/auth/session à chaque retour sur l'onglet (JWT de 30 jours)
    <SessionProvider refetchOnWindowFocus={false}>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
