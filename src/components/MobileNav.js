import React from "react";

/**
 * items: [{ key: 'home', label: 'Home', icon: <svg .../> }, ...]
 * active: string key
 * onSelect: (key) => void
 */
export default function MobileNav({ items = [], onSelect = () => {}, active }) {
  return (
    <nav className="mobile-nav" role="navigation" aria-label="Primary">
      <div className="mobile-nav__inner">
        {items.map((it) => (
          <button
            key={it.key}
            className={"mobile-nav__btn " + (active === it.key ? "is-active" : "")}
            onClick={() => onSelect(it.key)}
            aria-label={it.label}
            type="button"
          >
            {it.icon ? it.icon : null}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
