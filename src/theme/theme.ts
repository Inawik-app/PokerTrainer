export const themes = ["dark", "light"] as const;
export type Theme = (typeof themes)[number];

export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
