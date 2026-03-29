"use client";

import { useCallback, useLayoutEffect, useState } from "react";

/**
 * Many browsers autofill login fields on first paint. Starting with readOnly and
 * clearing it on focus is a common way to keep the first view empty until the user acts.
 *
 * WeChat (and similar WebViews) often will not show the soft keyboard on the first tap
 * when the field starts readOnly — the first tap only unlocks. We skip the gate there.
 */
export function useAutofillFieldGate() {
  const [bypassGate, setBypassGate] = useState(false);

  useLayoutEffect(() => {
    if (typeof navigator === "undefined") return;
    if (/MicroMessenger/i.test(navigator.userAgent)) {
      setBypassGate(true);
    }
  }, []);

  const [unlocked, setUnlocked] = useState(false);
  const onFocus = useCallback(() => {
    setUnlocked(true);
  }, []);

  const readOnly = !bypassGate && !unlocked;
  return { readOnly, onFocus };
}
