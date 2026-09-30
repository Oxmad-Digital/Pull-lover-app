"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mesure d'audience maison (sans cookie) : une vue par changement de page, puis le temps passé
// dessus quand elle est quittée ou masquée. Le serveur décide de ce qui est suivi (voir /api/track).

function sendDuration(id, token, duration) {
  const payload = JSON.stringify({ id, token, duration });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track/duration", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/track/duration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export default function Tracker() {
  // Sert uniquement à relancer l'effet à chaque navigation : l'URL réelle (avec /en) est lue
  // dans window.location, usePathname pouvant renvoyer le chemin réécrit par le proxy.
  const pathname = usePathname();

  useEffect(() => {
    const startedAt = Date.now();
    let view = null;
    let sent = false;

    const finalize = () => {
      if (sent || !view) return;
      sent = true;
      sendDuration(view.id, view.token, Date.now() - startedAt);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") finalize();
    };

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.id === "string" && typeof data?.token === "string") view = data;
      })
      .catch(() => {});

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", finalize);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", finalize);
      finalize();
    };
  }, [pathname]);

  return null;
}
