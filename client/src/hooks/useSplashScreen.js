import { useEffect, useState } from "react";

export function useSplashScreen(durationMs) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  return showSplash;
}
