/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Razorpay Brand & FinTech Semantic Palette
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAE0FD',
          300: '#7CC5FB',
          400: '#36A5F7',
          500: '#0C87EB',
          600: '#0284C7', // Core Razorpay Blue
          700: '#0369A1',
          800: '#075985',
          900: '#0C2D57', // Deep Brand Navy
          950: '#071830',
        },
        navy: {
          800: '#111E38',
          850: '#0E192E',
          900: '#0A1324',
          950: '#060B16',
        },
        surface: {
          card: '#0F172A',
          'card-hover': '#141E33',
          elevated: '#1E293B',
          input: '#090E1A',
          border: '#1E293B',
          'border-subtle': '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 24px -4px rgba(2, 132, 199, 0.25)',
        'glow-success': '0 0 24px -4px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.25)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
