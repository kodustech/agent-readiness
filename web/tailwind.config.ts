import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0a0f",
          card: "#12121a",
          elevated: "#1a1a25",
          border: "#2a2a3a",
        },
        accent: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          dim: "#92400e",
        },
        pass: "#22c55e",
        fail: "#ef4444",
        skip: "#6b7280",
      },
    },
  },
  plugins: [],
} satisfies Config;
