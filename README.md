# TRACKLINE 🚆

> **Precision Train Tracking & Transit Intelligence Web Application**  
> A high-performance, modern travel utility for real-time train tracking, schedule estimation, station concourse boards, and journey planning with full Light & Dark mode support.

---

## ✨ Features

- 🌓 **Bidirectional Light & Dark Themes**: System-aware and persistent theme toggle (via `localStorage`) with high-contrast surfaces and accessible status badges.
- 🎯 **Dominant Arrival Estimation**: Large tabular ETA display with scheduled vs. estimated comparison and real-time delay tracking.
- 📍 **Interactive Route Timeline**: Dynamic station progress with halt durations, platform indicators, and one-click target station re-calculation.
- 🔍 **Multi-Parametric Search & Autocomplete**: Instant search by train number (e.g. `22436`), train name, station code (`NDLS`), or destination city.
- 🚉 **Station Concourse Live Boards**: Dedicated arrival and departure boards for major junction stations with real-time status and platform indicators.
- 🧭 **Journey Planner**: Point-to-point train comparator with direct route suggestions and side-by-side transit metrics.
- 📌 **Local Session Watchlist**: Save frequently monitored trains in your browser for 1-click access.
- 🧪 **Interactive Demo Simulation Lab**: Test 5 real-world scenarios (On-time, Delayed 38m, Station Halt, Cruising, Journey Complete) with live delay sliders and simulated clock stepping (+5m, +15m, +1h).

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite 6+
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Architecture**: Context API + Local Storage persistence + Local simulated telemetry engine

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```
   The production-ready artifacts will be generated in the `dist/` directory.

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── layout/       # AppShell, TopNavigation, Footer
│   │   ├── tracking/     # ArrivalEstimateCard, RouteTimeline, LocationBanner
│   │   ├── schedule/     # Timetable cards and responsive tables
│   │   ├── search/       # Autocomplete search input and filters
│   │   ├── train/        # TrainStatusBadge with light/dark tokens
│   │   └── ui/           # ThemeToggle, SimulationDrawer (Demo Lab)
│   ├── context/
│   │   ├── SimulationContext.tsx  # Dynamic clock, scenarios, delay sliders
│   │   └── ThemeContext.tsx       # Light/Dark mode state and persistence
│   ├── data/
│   │   ├── mockTrains.ts   # 14 realistic high-speed & superfast trains
│   │   ├── mockStations.ts # 30+ major junction stations
│   │   └── scenarios.ts    # 5 verification simulation presets
│   ├── pages/            # Home, Search, Details, Schedule, Station, Planner, Saved
│   ├── types/            # TypeScript schemas (Train, Station, Telemetry)
│   ├── App.tsx           # Route provider and app providers
│   └── main.tsx          # Entry point
├── index.html
├── vite.config.ts
└── package.json
```

---

## 📄 License

This project is licensed under the MIT License.
