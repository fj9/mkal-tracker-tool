export type ThemeMode = "light" | "dark" | "system";

export const THEME_KEY = "kct-theme";
const PAGE = { light: "#fafcf9", dark: "#121715" };

export const isThemeMode = (v: unknown): v is ThemeMode => v === "light" || v === "dark" || v === "system";

/** Whether the app should be dark, given the user's choice and their phone's setting. */
export function resolveDark(mode: ThemeMode, prefersDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && prefersDark);
}

/** Applies the choice to the page. "system" removes the override so the phone's setting decides. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  const dark = resolveDark(mode, window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? PAGE.dark : PAGE.light);
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* private mode: the saved setting still applies after load */
  }
}
