import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

interface UseCollectionResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  load: () => Promise<void>;
}

export function useCollection<T>(
  path: string,
  errorMessage: string,
  params?: Record<string, string | undefined>
): UseCollectionResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<T[]>(`${path}${qs}`);
      setItems(data ?? []);
    } catch (e) {
      setError(getErrorMessage(e, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [path, qs, errorMessage]);

  const refresh = useCallback(async () => {
    try {
      const data = await api<T[]>(`${path}${qs}`);
      setItems(data ?? []);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e, errorMessage));
    }
  }, [path, qs, errorMessage]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh, load };
}
