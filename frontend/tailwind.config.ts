import type { Config } from 'tailwindcss'

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
          orange: '#FF7F50',
          dark: '#1C1C1C',
          card: '#2E2E2E',
          accent: '#FF4500',
          green: '#32CD32',
          border: '#8B4513',
        },
      },
    },
  },
  plugins: [],
}
export default config
