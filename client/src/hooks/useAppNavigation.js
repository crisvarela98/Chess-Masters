import { useState } from "react";

export function useAppNavigation(initialRoute) {
  const [route, setRoute] = useState(initialRoute);
  const [routeHistory, setRouteHistory] = useState([]);

  function navigateTo(nextRoute, options = {}) {
    const { replace = false } = options;
    if (nextRoute === route) return;
    if (!replace && route !== "ftue") {
      setRouteHistory((prev) => [...prev, route]);
    }
    setRoute(nextRoute);
  }

  function goBack() {
    setRouteHistory((prev) => {
      if (!prev.length) {
        setRoute("home");
        return prev;
      }
      const nextHistory = [...prev];
      const previousRoute = nextHistory.pop() || "home";
      setRoute(previousRoute);
      return nextHistory;
    });
  }

  function resetNavigation(nextRoute = "home") {
    setRoute(nextRoute);
    setRouteHistory([]);
  }

  return {
    route,
    routeHistory,
    navigateTo,
    goBack,
    resetNavigation,
    setRoute,
    setRouteHistory
  };
}
