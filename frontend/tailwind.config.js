/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Easily customizable color tokens for the entire project
        rail: {
          bg: "#0B1329",        // Deep Navy Slate Background
          card: "#152238",      // Elevated Card Background
          border: "#233554",    // Card Border
          muted: "#8892B0",     // Subdued Text
          accent: "#0284C7",    // Primary Action / Electric Sky Blue
          accentHover: "#0369A1",
          // Signal status colors
          green: "#10B981",     // Clear signal / On-time
          yellow: "#F59E0B",    // Caution / Moderate Delay
          red: "#EF4444",       // Congestion / Severe Delay
        }
      }
    },
  },
  plugins: [],
}
