/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx,md}', './components/**/*.{js,ts,jsx,tsx,mdx,md}'],
  theme: {
    extend: {
      // colors: {
      //   primary: {
      //     50: 'var(--primary-color-50)',
      //     100: 'var(--primary-color-100)',
      //     200: 'var(--primary-color-200)',
      //     300: 'var(--primary-color-300)',
      //     400: 'var(--primary-color-400)',
      //     500: 'var(--primary-color-500)',
      //     600: 'var(--primary-color-600)',
      //     700: 'var(--primary-color-700)',
      //     800: 'var(--primary-color-800)',
      //     900: 'var(--primary-color-900)',
      //   },
      // },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
    },
    plugins: [],
  },
};
