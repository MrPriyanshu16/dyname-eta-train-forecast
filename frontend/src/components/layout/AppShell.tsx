import React from 'react';
import { TopNavigation } from './TopNavigation';
import { SimulationDrawer } from '../ui/SimulationDrawer';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Building2, Search, Bookmark } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

interface AppShellProps {
  children: React.ReactNode;
  currentTrainId?: string;
}

export const AppShellComponent: React.FC<AppShellProps> = ({ children, currentTrainId }) => {
  const location = useLocation();
  const { savedTrainIds } = useSimulation();

  const mobileNavItems = [
    { label: 'Track', path: '/', icon: Search },
    { label: 'Stations', path: '/station/JU', icon: Building2 },
    { label: 'Planner', path: '/journey-planner', icon: Compass },
    {
      label: 'Saved',
      path: '/saved',
      icon: Bookmark,
      badge: savedTrainIds.length > 0 ? savedTrainIds.length : undefined
    }
  ];

  const isLiveCorridor = location.pathname === '/live-corridor';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-600 selection:text-white pb-16 md:pb-0 transition-colors duration-200 ${isLiveCorridor ? 'h-screen overflow-hidden' : ''}`}>
      {/* Top Navbar */}
      <TopNavigation />

      {/* Main Page Area */}
      <main className={`flex-1 w-full ${isLiveCorridor ? 'h-[calc(100vh-64px)] overflow-hidden p-0 m-0' : ''}`}>{children}</main>

      {/* Discreet Footer (Hidden on Live Corridor for Full-Screen Map Experience) */}
      {!isLiveCorridor && (
        <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-slate-800 dark:text-white text-sm font-sans">TRACKLINE</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-slate-400 dark:text-slate-500">Intelligent Transit Platform</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-center sm:text-right text-[11px]">
              AI-driven ETA forecasting, live route intelligence, and dynamic delay prediction.
            </p>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around py-2 px-1 shadow-lg transition-colors">
        {mobileNavItems.map(item => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.5 text-[9px] font-mono font-bold bg-indigo-600 text-white rounded-full leading-tight">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Developer / Demo Simulator Drawer (Hidden on Live Corridor where dedicated sandbox controls exist) */}
      {!isLiveCorridor && <SimulationDrawer currentTrainId={currentTrainId} />}
    </div>
  );
};

export const AppShell = React.memo(AppShellComponent);
