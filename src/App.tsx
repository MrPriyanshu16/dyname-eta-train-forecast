import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SimulationProvider } from './context/SimulationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TrainDetailsPage } from './pages/TrainDetailsPage';
import { SchedulePage } from './pages/SchedulePage';
import { StationSchedulePage } from './pages/StationSchedulePage';
import { JourneyPlannerPage } from './pages/JourneyPlannerPage';
import { SavedTrainsPage } from './pages/SavedTrainsPage';

const AppContent: React.FC = () => {
  const location = useLocation();

  // Extract trainId from pathname if present (e.g. /train/12951)
  const trainMatch = location.pathname.match(/\/train\/([^/]+)/);
  const currentTrainId = trainMatch ? trainMatch[1] : undefined;

  return (
    <AppShell currentTrainId={currentTrainId}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/train/:trainId" element={<TrainDetailsPage />} />
        <Route path="/train/:trainId/schedule" element={<SchedulePage />} />
        <Route path="/station/:stationId" element={<StationSchedulePage />} />
        <Route path="/journey-planner" element={<JourneyPlannerPage />} />
        <Route path="/saved" element={<SavedTrainsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
