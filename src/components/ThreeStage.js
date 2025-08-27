import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useIsMobile } from "../hooks/useIsMobile";

/**
 * Wrap your 3D scene with <ThreeStage> ...children... </ThreeStage>
 * This tunes DPR, AA, shadows, and frameloop for mobile performance.
 */
export default function ThreeStage({ children }) {
  const isMobile = useIsMobile();
  const dpr = useMemo(() => {
    const max = isMobile ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);
    return [1, max];
  }, [isMobile]);

  return (
    <Canvas
      dpr={dpr}
      shadows={false}
      gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
      frameloop={isMobile ? "demand" : "always"}  /* pause when idle on mobile */
      camera={{ fov: isMobile ? 55 : 50, position: [0, 1.2, 3] }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
