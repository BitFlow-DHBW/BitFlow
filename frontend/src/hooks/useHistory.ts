import { useEffect, useState } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initial: T, resetKey?: string) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  useEffect(() => {
    setHistory({
      past: [],
      present: initial,
      future: [],
    });
  }, [initial, resetKey]);

  const set = (value: T, previous?: T) => {
    setHistory((prev) => ({
      past: [...prev.past, previous ?? prev.present],
      present: value,
      future: [],
    }));
  };

  const replace = (value: T) => {
    setHistory((prev) => ({ ...prev, present: value }));
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  };

  const redo = () => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  };

  return {
    state: history.present,
    set,
    replace,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
