import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dragon: {
          bg: '#1C1C1C',
          card: '#2E2E2E',
          accent: '#FF4500',
          heading: '#FF7F50',
          link: '#32CD32',
          alert: '#FF0000',
          border: '#8B4513',
          banner: '#FFA500',
          footer: '#0D1117',
        },
      },
    },
  },
  plugins: [],
};

export default config;
