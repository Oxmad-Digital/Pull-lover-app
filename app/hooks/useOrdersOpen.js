"use client";

import { useEffect, useState } from "react";

/** Commandes ouvertes ou non (réglage admin). Ouvertes par défaut tant que la réponse n'est pas arrivée : le serveur bloque de toute façon le paiement. */
export function useOrdersOpen() {
  const [ordersOpen, setOrdersOpen] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setOrdersOpen(data.ordersOpen !== false); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return ordersOpen;
}
