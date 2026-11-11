"use client";

import { useCallback, useRef, useState } from "react";

/** Verrouille une action async (double clic, spam bouton). */
export function useActionLock() {
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const run = useCallback(async (action: () => Promise<void> | void) => {
    if (lockedRef.current) return false;
    lockedRef.current = true;
    setLocked(true);
    try {
      await action();
      return true;
    } finally {
      lockedRef.current = false;
      setLocked(false);
    }
  }, []);

  return { locked, run };
}
