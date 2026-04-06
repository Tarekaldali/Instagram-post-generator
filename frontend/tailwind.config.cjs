module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0f0f0f',
        card: '#1a1a1a',
        line: '#2a2a2a',
        mint: '#75f7b3',
        steel: '#97a0b0',
      },
      boxShadow: {
        glow: '0 16px 50px rgba(0, 0, 0, 0.45)',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        fadeUp: 'fadeUp 500ms ease-out both',
      },
    },
  },
  plugins: [],
};
