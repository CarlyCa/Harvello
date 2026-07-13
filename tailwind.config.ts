import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          ink: "#172421",
          green: "#2f6f5e",
          leaf: "#6f9f80",
          sky: "#dcebf1",
          paper: "#f7f4ed",
          line: "#d8ddd4"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 36, 33, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
