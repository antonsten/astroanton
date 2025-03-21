/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        black: '#131313',
        'dark-grey': '#74726B',
        'light-grey': '#F3F3F1',
        white: '#FFFFFF',
        green: '#00A35C',
        'light-green': '#D1E8BD',
      },
      fontFamily: {
        sans: ['"Suisse Intl"', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
      },
      fontSize: {
        // Display sizes
        'display-lg': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        
        // Heading sizes
        'h1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'h2': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h4': ['1.5rem', { lineHeight: '1.25' }],
        'h5': ['1.25rem', { lineHeight: '1.25' }],
        
        // Body sizes
        'xl': ['1.25rem', { lineHeight: '1.75', letterSpacing: '-0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75' }],
        'base': ['1rem', { lineHeight: '1.75' }],
        'sm': ['0.875rem', { lineHeight: '1.75' }],
        'xs': ['0.75rem', { lineHeight: '1.75' }],
      },
    },
  },
  plugins: []
} 