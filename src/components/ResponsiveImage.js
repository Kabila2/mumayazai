import React from "react";

/**
 * Example usage:
 * <ResponsiveImage
 *   alt="Mumayaz"
 *   src="/assets/hero@640w.jpg"
 *   srcSet="/assets/hero@640w.jpg 640w, /assets/hero@960w.jpg 960w, /assets/hero@1440w.jpg 1440w"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 */
export default function ResponsiveImage(props) {
  return (
    <img
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
