/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          'border-subtle': 'var(--border-subtle)',
          'border-default': 'var(--border-default)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
          'subtle-bg': 'var(--brand-subtle-bg)',
        },
        semantic: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          danger: 'var(--color-danger)',
          'danger-bg': 'var(--color-danger-bg)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
        }
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
      },
      borderRadius: {
        'radius-sm': '6px',
        'radius-md': '10px',
        'radius-lg': '14px',
        'radius-full': '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
