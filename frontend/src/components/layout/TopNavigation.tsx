import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimulation } from '../../context/SimulationContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Compass,
  Building2,
  Bookmark,
  Menu,
  X,
  Radio
} from 'lucide-react';

export const TopNavigationComponent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { savedTrainIds, simulatedTime } = useSimulation();

  const navLinks = [
    { label: 'Track Train', path: '/', icon: Compass },
    { label: 'Live Corridor & ML', path: '/live-corridor', icon: Radio },
    { label: 'Station Boards', path: '/station/JU', icon: Building2 },
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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand - pure TRACKLINE font, no image logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-extrabold tracking-wider text-slate-900 dark:text-white text-lg sm:text-xl font-sans drop-shadow-xs">
                TRACKLINE
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-400/30 px-1.5 py-0.5 rounded-full">
                Live
              </span>
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
                      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full">
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Live Transit Time</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{simulatedTime}</span>
            </div>

            {/* Dark/Light Mode Theme Toggle */}
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
              Clock: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{simulatedTime}</span>
            </span>
            <ThemeToggle size="sm" showLabel />
          </div>

          {navLinks.map(link => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

export const TopNavigation = React.memo(TopNavigationComponent);
