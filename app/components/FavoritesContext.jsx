"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { toFavorite } from "@/app/lib/favorites.mjs";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // Chargés seulement quand une page s'en sert (useFavorites), pas sur chaque page du site
  const [requested, setRequested] = useState(false);
  const request = useCallback(() => setRequested(true), []);
  const loading = status === "authenticated" && !loaded;
  const favoritesRef = useRef(favorites);
  useEffect(() => { favoritesRef.current = favorites; }, [favorites]);

  // Déconnexion ou changement de compte : la liste repart de zéro (réinitialisée au rendu)
  const owner = status === "authenticated" ? session?.user?.email ?? null : null;
  const [loadedFor, setLoadedFor] = useState(owner);
  if (loadedFor !== owner) {
    setLoadedFor(owner);
    setFavorites([]);
    setLoaded(false);
  }

  useEffect(() => {
    if (!owner || !requested || loaded) return;
    let active = true;
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setFavorites(data); })
      .catch(console.error)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [owner, requested, loaded]);

  const toggleFavorite = useCallback(async (product) => {
    if (status === "loading") return;
    if (!session) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    const alreadyFav = favoritesRef.current.some((p) => p._id === product._id);

    if (alreadyFav) {
      setFavorites((prev) => prev.filter((p) => p._id !== product._id));
      fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      }).catch(console.error);
    } else {
      setFavorites((prev) => [...prev, toFavorite(product)]);
      fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      }).catch(console.error);
    }
  }, [session, status]);

  const isFavorite = useCallback(
    (id) => favorites.some((p) => p._id === id),
    [favorites]
  );

  const removeFavorite = useCallback(async (id) => {
    if (!session) return;
    setFavorites((prev) => prev.filter((p) => p._id !== id));
    fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    }).catch(console.error);
  }, [session]);

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite, removeFavorite, loading, request }),
    [favorites, toggleFavorite, isFavorite, removeFavorite, loading, request]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  const { request } = context;
  useEffect(() => { request(); }, [request]);
  return context;
}
