/** @type {import('tailwindcss').Config} */
export default {
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
          alt: 'var(--bg-alt)',
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
        palette: {
          ink: 'var(--color-ink)',
          bg: 'var(--color-bg)',
          'bg-alt': 'var(--color-bg-alt)',
          surface: 'var(--color-surface)',
          'surface-alt': 'var(--color-surface-alt)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          success: 'var(--color-success)',
          mint: 'var(--color-mint)',
          danger: 'var(--color-danger)',
          'danger-bg': 'var(--color-danger-bg)',
        },
        badge: {
          'success-bg': 'var(--badge-success-bg)',
          'success-text': 'var(--badge-success-text)',
          'warning-bg': 'var(--badge-warning-bg)',
          'warning-text': 'var(--badge-warning-text)',
          'info-bg': 'var(--badge-info-bg)',
          'info-text': 'var(--badge-info-text)',
          'danger-bg': 'var(--badge-danger-bg)',
          'danger-text': 'var(--badge-danger-text)',
        },
        ink: 'var(--color-ink)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        mint: 'var(--color-mint)',
        semantic: {
          'warning-bg': 'var(--badge-warning-bg)',
          'warning': 'var(--badge-warning-text)',
          'danger-bg': 'var(--badge-danger-bg)',
          'danger': 'var(--badge-danger-text)',
          'success-bg': 'var(--badge-success-bg)',
          'success': 'var(--badge-success-text)',
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
        'space-16': '64px',
        'space-20': '80px',
      },
      borderRadius: {
        'radius-sm': '8px',
        'radius-md': '12px',
        'radius-lg': '16px',
        'radius-xl': '20px',
        'radius-full': '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
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
