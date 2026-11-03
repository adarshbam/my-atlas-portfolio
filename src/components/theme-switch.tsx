import { useState } from "react";

export type Theme = "light" | "dark";
export const themeStorageKey = "atlas-theme-v1";

/** Color-only updates: never recreate the page engine or move keyboard focus. */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const choose = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      /* The choice still works in memory. */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--desk")
          .trim(),
      );
  };
  return (
    <div className="theme-switch" role="group" aria-label="Desk theme">
      {(["light", "dark"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => choose(value)}
        >
          {value === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </div>
  );
}
