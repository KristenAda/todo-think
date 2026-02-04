/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {},
  },
  content: ['./src/**/*.{html,js,vue}'], // 新选项
  plugins: [],
  corePlugins: {
    preflight: false, // 关闭默认样式
  },
};
