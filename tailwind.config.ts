import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14110f",
        paper: "#fbfaf7",
        line: "#ded8cc",
        sage: "#567568",
        brass: "#b98f45",
        danger: "#c2413b",
        warn: "#b7791f",
        safe: "#2f855a"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(20, 17, 15, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
