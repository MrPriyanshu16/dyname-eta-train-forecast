import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'md', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center justify-center rounded-lg transition-all border cursor-pointer ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
      } ${size === 'sm' ? 'p-1.5' : 'p-2'}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
