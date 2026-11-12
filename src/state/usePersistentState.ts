import { useEffect, useState } from 'react';

/**
 * Comme useState, mais la valeur est gardée dans sessionStorage :
 * elle survit à la navigation (ouvrir une question puis revenir) et au rechargement,
 * et elle est oubliée à la fermeture de l'onglet.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const storageKey = `digest:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw) as T;
      // Les objets sont fusionnés avec la valeur initiale (nouveaux champs ajoutés plus tard).
      return initial && typeof initial === 'object' && !Array.isArray(initial) ? { ...initial, ...parsed } : parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* stockage indisponible : on garde simplement l'état en mémoire */
    }
  }, [storageKey, value]);
  return [value, setValue] as const;
}
