import { useState, useEffect, useRef } from "react";

/**
 * Hook paginé générique pour les pages admin.
 *
 * @param {string}   url         - Endpoint API (ex. "/api/admin/products")
 * @param {object}   queryParams - Filtres/tri déjà debounced passés par le caller
 * @param {object}   [options]
 * @param {string}   [options.itemsKey="items"]  - Clé du tableau dans la réponse JSON
 * @param {number}   [options.perPage]            - Ajoute limit= dans les params
 * @param {function} [options.onData]             - Callback appelé avec le JSON brut (ex. pour extraire stats)
 *
 * @returns {{ items, pagination, loading, error, page, setPage }}
 *   pagination : { total, totalPages }  (normalisé depuis pages ou totalPages)
 */
export function usePaginatedFetch(url, queryParams, { itemsKey = "items", perPage, onData } = {}) {
  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);

  const isFirst   = useRef(true);
  const paramsKey = JSON.stringify(queryParams);

  // onData est souvent une fonction inline : on garde la dernière version sans relancer le fetch
  const onDataRef = useRef(onData);
  useEffect(() => { onDataRef.current = onData; });

  // Réinitialise la page quand les filtres changent (skip premier rendu)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    setPage(1);
  }, [paramsKey]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const p = new URLSearchParams();
        Object.entries({ ...JSON.parse(paramsKey ?? "{}"), page }).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
        });
        if (perPage) p.set("limit", String(perPage));

        const res  = await fetch(`${url}?${p}`, { signal: controller.signal });
        const data = await res.json();

        setItems(data[itemsKey] ?? []);

        const pg = data.pagination || {};
        setPagination({
          total:      pg.total      ?? 0,
          totalPages: pg.totalPages ?? pg.pages ?? 1,
        });

        if (onDataRef.current) onDataRef.current(data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Erreur réseau");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [url, paramsKey, page, itemsKey, perPage]);

  return { items, pagination, loading, error, page, setPage };
}
