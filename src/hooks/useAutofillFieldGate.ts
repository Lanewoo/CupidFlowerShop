"use client";

import { useCallback, useState } from "react";

/**
 * Many browsers autofill login fields on first paint. Starting with readOnly and
 * clearing it on focus is a common way to keep the first view empty until the user acts.
 */
export function useAutofillFieldGate() {
  const [unlocked, setUnlocked] = useState(false);
  const onFocus = useCallback(() => {
    setUnlocked(true);
  }, []);
  return { readOnly: !unlocked, onFocus };
}
