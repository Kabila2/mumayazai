import { useEffect } from "react";

export function useViewportHeight() {
  useEffect(() => {
    const set = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    };
    set();

    // Use ResizeObserver for URL-bar show/hide and rotations
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(set);
      ro.observe(document.documentElement);
    }

    const onOrientation = () => set();
    window.addEventListener("orientationchange", onOrientation, { passive: true });
    window.addEventListener("resize", set, { passive: true });

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("resize", set);
      if (ro) ro.disconnect();
    };
  }, []);
}
