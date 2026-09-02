/**
 * frontend/src/components/ui/ThemeToggle.jsx
 * Interactive Sun/Moon theme switcher with smooth transition.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-radius-md bg-theme-surface hover:bg-theme-elevated border border-theme-border-subtle text-theme-secondary hover:text-theme-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-2 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-badge-warning-text transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-primary transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
