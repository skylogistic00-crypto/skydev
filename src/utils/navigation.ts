import { NavigateFunction } from "react-router-dom";

/**
 * Safe navigation back with fallback
 * If there's no history, navigate to fallback route
 */
export const navigateBack = (navigate: NavigateFunction, fallback: string = "/") => {
  // Check if we can go back
  if (window.history.state && window.history.state.idx > 0) {
    navigate(-1);
  } else {
    // No history, navigate to fallback
    navigate(fallback, { replace: true });
  }
};
