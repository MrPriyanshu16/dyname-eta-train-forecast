import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimulation } from '../../context/SimulationContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Compass,
  Calendar,
  Bookmark,
  Building2,
  Menu,
  X,
  Radio,
  Search
} from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { savedTrainIds, simulatedTime } = useSimulation();

  const navLinks = [
    { label: 'Track Train', path: '/', icon: Compass },
    { label: 'Station Boards', path: '/station/NDLS', icon: Building2 },
    { label: 'Plan Journey', path: '/journey-planner', icon: Compass },
    {
      label: 'Saved Trains',
      path: '/saved',
      icon: Bookmark,
      badge: savedTrainIds.length > 0 ? savedTrainIds.length : undefined
    }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-800 dark:group-hover:bg-indigo-500 transition-colors">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <div className="w-4 h-0.5 bg-blue-300 rounded-full" />
                  <div className="w-4 h-0.5 bg-white rounded-full" />
                  <div className="w-4 h-0.5 bg-blue-300 rounded-full" />
                </div>
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                  TRACKLINE
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/80 px-1.5 py-0.2 rounded ml-2">
                  Live
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      active
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Live simulation indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Simulated Clock</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">{simulatedTime}</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <ThemeToggle />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 rounded-lg mb-2 border border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Simulated Live Clock
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{simulatedTime}</span>
          </div>

          {navLinks.map(link => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
