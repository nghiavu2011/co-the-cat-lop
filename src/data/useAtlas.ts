import { useEffect, useState } from 'react';
import type { AtlasJSON } from './types';
import { loadAtlasJSON, loadAtlasFemaleJSON } from './loader';

export function useAtlas(gender: 'male' | 'female' = 'male'): { atlas: AtlasJSON | null; error: string | null } {
  const [atlas, setAtlas] = useState<AtlasJSON | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = gender === 'female' ? loadAtlasFemaleJSON : loadAtlasJSON;
    loader()
      .then((a) => {
        if (!cancelled) setAtlas(a);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [gender]);

  return { atlas, error };
}
