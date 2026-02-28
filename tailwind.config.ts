import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "midnight-ink": "#0B0F19",
        "electric-teal": "#00F5D4",
        "cyber-amber": "#FFB000",
        "soft-cloud": "#E2E8F0",
        /* Legacy aliases for existing classes */
        "deep-ink": "#0B0F19",
        "transformative-teal": "#00F5D4",
        "cloud-dancer": "#E2E8F0",
        card: "#131922",
        border: "#1e293b",
        primary: {
          DEFAULT: "#00F5D4",
          50: "#e6fffc",
          100: "#b3fff7",
          200: "#80fff2",
          300: "#4dffed",
          400: "#1affe8",
          500: "#00F5D4",
          600: "#00c4aa",
          700: "#009380",
          800: "#006255",
          900: "#00312b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
