export const theme = {
  colors: {
    background: "#F9FAFB",
    foreground: "#0A2540",
    card: "#ffffff",
    text: "#0A2540",
    primary: "#0A2540",
    secondary: "#F9FAFB",
    accent: "#FFB703",
    primaryHover: "#F97316",
    border: "rgba(10, 37, 64, 0.1);",
    inputBackground: "#f3f3f5",
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
  },
  space: (n: number) => `${4 * n}px`, // space(4) => 16px
};
export type AppTheme = typeof theme;
