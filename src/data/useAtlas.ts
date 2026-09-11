import { useEffect, useState } from 'react';
import type { AtlasJSON } from './types';
import { loadAtlasJSON } from './loader';

export function useAtlas(): { atlas: AtlasJSON | null; error: string | null } {
  const [atlas, setAtlas] = useState<AtlasJSON | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAtlasJSON()
      .then((a) => {
        if (!cancelled) setAtlas(a);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { atlas, error };
}
