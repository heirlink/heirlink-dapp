import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      colors: {
        // Стиль презентации Heirlink
        ink: "#102E5C", // тёмно-синий бренда (логотип)
        gold: "#B89A6B", // золото/бронза иконки
        paper: "#F8F7F0", // кремовый фон презентации
        muted: "#333333", // тёмно-серый для подзаголовков
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16,46,92,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
