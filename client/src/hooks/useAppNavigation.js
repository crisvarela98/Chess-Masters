import { useEffect, useState } from "react";

export function useAppNavigation(initialRoute) {
  const [route, setRoute] = useState(initialRoute);
  const [routeHistory, setRouteHistory] = useState([]);

  useEffect(() => {
    window.history.replaceState({ cmRoute: initialRoute, cmHistory: [] }, "", window.location.href);

    function handlePopState(event) {
      const state = event.state;
      if (state?.cmRoute) {
        setRoute(state.cmRoute);
        setRouteHistory(Array.isArray(state.cmHistory) ? state.cmHistory : []);
        return;
      }

      setRoute("home");
      setRouteHistory([]);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialRoute]);

  function navigateTo(nextRoute, options = {}) {
    const { replace = false } = options;
    if (nextRoute === route) return;
    const nextHistory = !replace && route !== "ftue" ? [...routeHistory, route] : routeHistory;
    setRouteHistory(nextHistory);
    setRoute(nextRoute);
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ cmRoute: nextRoute, cmHistory: nextHistory }, "", window.location.href);
  }

  function goBack() {
    if (routeHistory.length > 0 && window.history.state?.cmRoute) {
      window.history.back();
      return;
    }

    setRouteHistory((prev) => {
      if (!prev.length) {
        setRoute("home");
        window.history.replaceState({ cmRoute: "home", cmHistory: [] }, "", window.location.href);
        return prev;
      }
      const nextHistory = [...prev];
      const previousRoute = nextHistory.pop() || "home";
      setRoute(previousRoute);
      window.history.replaceState({ cmRoute: previousRoute, cmHistory: nextHistory }, "", window.location.href);
      return nextHistory;
    });
  }

  function resetNavigation(nextRoute = "home") {
    setRoute(nextRoute);
    setRouteHistory([]);
    window.history.replaceState({ cmRoute: nextRoute, cmHistory: [] }, "", window.location.href);
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
