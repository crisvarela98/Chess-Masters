import { useEffect, useState } from "react";

export function useTransientTip(tips, durationMs = 3000) {
  const [activeTip, setActiveTip] = useState("");
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!activeTip) return undefined;
    const timer = window.setTimeout(() => setActiveTip(""), durationMs);
    return () => window.clearTimeout(timer);
  }, [activeTip, durationMs]);

  function showNextTip() {
    const nextTip = tips[tipIndex % tips.length];
    setActiveTip(nextTip);
    setTipIndex((prev) => (prev + 1) % tips.length);
  }

  return {
    activeTip,
    showNextTip
  };
}
