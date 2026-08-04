"use client";

import { useEffect, useState } from "react";

const THEMES = [
  "light",
  "dark",
  "cupcake",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "aqua",
  "night",
  "dracula",
] as const;

const STORAGE_KEY = "concert-cost-theme";

export function ThemeSelector({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<string>("night");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const next = saved && THEMES.includes(saved as (typeof THEMES)[number]) ? saved : "night";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  function onChange(value: string) {
    setTheme(value);
    document.documentElement.setAttribute("data-theme", value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm opacity-70 whitespace-nowrap">Theme</span>
      <select
        className="select select-bordered select-sm"
        value={theme}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Choose app theme"
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','night');}catch(e){document.documentElement.setAttribute('data-theme','night');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
