/**
 * frontend/src/components/ui/Modal.jsx
 * Accessible dialog modal with backdrop blur and keyboard escape listener.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, description, children, className = '' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-theme-surface border border-theme-border-default rounded-radius-lg max-w-lg w-full p-space-6 shadow-theme-md animate-slide-up space-y-space-4 relative ${className}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-h3 font-semibold text-theme-primary">{title}</h3>
            {description && <p className="text-body-sm text-theme-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-elevated rounded-radius-sm transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-space-2">{children}</div>
      </div>
    </div>
  );
}
