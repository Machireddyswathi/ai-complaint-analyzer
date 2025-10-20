/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Enterprise Colors
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f46e5', // Indigo
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#1e1b4b',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b', // Amber
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444', // Red
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Blue
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'checkmark': 'checkmark 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }
    },
  },
  plugins: [],
}