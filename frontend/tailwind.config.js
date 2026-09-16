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
        // Matte-black & refined charcoal tokens matching reference design
        rail: {
          bg: "#0B0C10",         // Deep matte-black background
          surface: "#121318",     // Panel surface
          card: "#181920",       // Elevated card background
          cardHover: "#20222B",  // Card hover state
          border: "#262833",     // Subtle modern border
          borderSubtle: "#1B1C24",
          muted: "#8A90A2",      // Refined silver-gray text
          accent: "#38BDF8",     // Crisp electric sky blue
          accentHover: "#0284C7",
          // Signal status colors
          green: "#10B981",      // Clear signal / On-time
          yellow: "#F59E0B",     // Caution / Moderate Delay
          red: "#EF4444",        // Congestion / Severe Delay
        }
      }
    },
  },
  plugins: [],
}
