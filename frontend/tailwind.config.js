/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Body text
        heading: ['Schoolbell', 'cursive'], // Headers
        chinese: ['Ma Shan Zheng', 'cursive'], // Chinese text
      },
      colors: {
        border: '#E5E7EB',

        // UM Brand Colors
        umblue: {
          DEFAULT: '#00205B',
          50: '#E5E8F0',
          100: '#CCD1E0',
          200: '#99A3C2',
          300: '#6675A3',
          400: '#334785',
          500: '#00205B',  // main
          600: '#001A4A',
          700: '#00133A',
          800: '#000D29',
          900: '#000719',
        },
        umyellow: {
          DEFAULT: '#FFD100',
          50: '#FFFBE6',
          100: '#FFF7CC',
          200: '#FFEF99',
          300: '#FFE666',
          400: '#FFDE33',
          500: '#FFD100',  // main
          600: '#E6BC00',
          700: '#CCA700',
          800: '#B39300',
          900: '#998000',
        },

        // Neutral greys for backgrounds and borders
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },

      boxShadow: {
        'soft': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'card': '0 6px 16px rgba(0, 32, 91, 0.08)', // subtle blue shadow
      },

      backgroundImage: {
        'um-gradient': 'linear-gradient(135deg, #00205B 0%, #FFD100 100%)',
      },
    },
  },
  plugins: [],
}
