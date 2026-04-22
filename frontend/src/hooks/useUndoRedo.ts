import { useState, useCallback } from "react";
import type { Circuit } from "../types/circuit";

export function useUndoRedo(initial: Circuit) {
  const [past, setPast] = useState<Circuit[]>([]);
  const [present, setPresent] = useState<Circuit>(initial);
  const [future, setFuture] = useState<Circuit[]>([]);

  const set = useCallback((next: Circuit) => {
    setPast(p => [...p, present]);
    setPresent(next);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture(f => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast(p => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  return { present, set, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
