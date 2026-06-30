/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // يغطي جميع ملفات React
  ],
  theme: {
    extend: {}, // يمكنك تخصيص الألوان، الخطوط، إلخ هنا
  },
  plugins: [], // أضف plugins مثل @tailwindcss/forms إذا لزم الأمر
}
