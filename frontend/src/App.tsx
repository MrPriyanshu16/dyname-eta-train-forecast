import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';

// Code-split pages with React.lazy
const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const TrainDetailsPage = React.lazy(() => import('./pages/TrainDetailsPage').then(m => ({ default: m.TrainDetailsPage })));
const SchedulePage = React.lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const StationSchedulePage = React.lazy(() => import('./pages/StationSchedulePage').then(m => ({ default: m.StationSchedulePage })));
const JourneyPlannerPage = React.lazy(() => import('./pages/JourneyPlannerPage').then(m => ({ default: m.JourneyPlannerPage })));
const SavedTrainsPage = React.lazy(() => import('./pages/SavedTrainsPage').then(m => ({ default: m.SavedTrainsPage })));
const LiveCorridorPage = React.lazy(() => import('./pages/LiveCorridorPage').then(m => ({ default: m.LiveCorridorPage })));

const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Loading transit data...</span>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const location = useLocation();

  // Extract trainId from pathname if present (e.g. /train/12951)
  const trainMatch = location.pathname.match(/\/train\/([^/]+)/);
  const currentTrainId = trainMatch ? trainMatch[1] : undefined;

  return (
    <AppShell currentTrainId={currentTrainId}>
      <React.Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/live-corridor" element={<LiveCorridorPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/train/:trainId" element={<TrainDetailsPage />} />
          <Route path="/train/:trainId/schedule" element={<SchedulePage />} />
          <Route path="/station/:stationId" element={<StationSchedulePage />} />
          <Route path="/journey-planner" element={<JourneyPlannerPage />} />
          <Route path="/saved" element={<SavedTrainsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SimulationProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SimulationProvider>
    </ThemeProvider>
  );
};

export default App;
