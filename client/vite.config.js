import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// 支持Vue3
import vue from '@vitejs/plugin-vue';

// 按需引入+自动导入 Element-Plus
import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
// 压缩打包后的文件
import viteCompression from 'vite-plugin-compression';
// 可视化的依赖关系图
import { visualizer } from 'rollup-plugin-visualizer';

// 加载和处理SVG文件
import svgLoader from 'vite-svg-loader';

// postcss插件
import postcssPresetEnv from 'postcss-preset-env';

// import requireTransform from 'vite-plugin-require-transform';

// import commonjs from '@rollup/plugin-commonjs';

import legacy from '@vitejs/plugin-legacy';
// 引入⬇️
import postCssPxToRem from 'postcss-pxtorem';

import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export default ({ mode }) => {
  // 通过mode判断环境
  const isProduction = mode === 'production';
  // 读取env配置
  const env = loadEnv(mode, process.cwd());
  const buildOutDir = env.VITE_OUT_DIR || 'dist';

  const optimizeDepsElementPlusIncludes = [
    'element-plus/es',
    'element-plus/es/components/*/style/css',
    '@wangeditor-next/editor-for-vue',
    'image-conversion',
    'bcryptjs',
    'lodash-es',
    '@vueuse/core',
  ];
  fs.readdirSync('node_modules/element-plus/es/components').forEach(
    (dirname) => {
      fs.access(
        `node_modules/element-plus/es/components/${dirname}/style/css.mjs`,
        (err) => {
          if (!err) {
            optimizeDepsElementPlusIncludes.push(
              `element-plus/es/components/${dirname}/style/css`,
            );
          }
        },
      );
    },
  );
  // 开始构建配置SAP
  return defineConfig({
    // 预构建，避免开发环境每次重新构建 - 因为element-plus是按需引入
    optimizeDeps: {
      include: optimizeDepsElementPlusIncludes,
    },
    resolve: {
      alias: [
        {
          find: /^~/,
          replacement: '',
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src'),
        },
      ],
      // 导入时想要省略的扩展名列表
      // 不建议使用 .vue 影响IDE和类型支持
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler', // 关键配置
        },
      },
      postcss: {
        plugins: [
          postcssPresetEnv(),
          postCssPxToRem({
            // 1. 基准值设置 16。
            // 这意味着 16px = 1rem。这样在 PC 端方便调试，且符合 PC 默认逻辑。
            rootValue: 16,

            // 2. 转换所有属性 (width, height, margin, font-size 等)
            propList: ['*'],

            // 3. 转换精度，保留5位小数
            unitPrecision: 5,

            // 4. 【关键配置】排除 node_modules
            // 目的：让 Element Plus 等第三方 PC 库保持 px 单位，
            // 避免它们在移动端适配逻辑中变得过大或过小。
            exclude: /node_modules/i,

            // 5. 忽略少于 1px 的属性不转换
            minPixelValue: 1,
          }),
          tailwindcss,
          autoprefixer({
            // 自动添加前缀
            overrideBrowserslist: [
              'Android 4.1',
              'iOS 7.1',
              'Chrome > 31',
              'ff > 31',
              'Safari >= 6',
              'ie >= 8',
              // 'last 2 versions', // 所有主流浏览器最近2个版本
            ],
            grid: true,
          }),
        ],
      },

      processorOptions: {
        scss: {
          api: 'modern-compiler', // or 'modern'
        },
      },
    },

    plugins: [
      // commonjs(),
      vue(),
      visualizer(), // visualizer({ open: true })  // 开启拆包分析
      viteCompression(),

      svgLoader(),

      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/head', '@vueuse/core'],
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],

        // 自动引入的部分不会被eslint提示错误
        eslintrc: {
          enabled: true,
        },
        extends: [
          // ...
          './.eslintrc-auto-import.json',
        ],
        //
        // 可以选择auto-import.d.ts生成的位置，使用ts建议设置为'src/auto-import.d.ts'
        // dts: "src/auto-import.d.ts",

        // 按需引入+自动导入 Element-Plus
        resolvers: [ElementPlusResolver({ importStyle: 'css', icons: true })],
      }),
      Components({
        // 按需引入+自动导入 Element-Plus
        resolvers: [ElementPlusResolver({ importStyle: 'css', icons: true })],
        // 项目库公共组件 src/components
        dirs: ['src/components'],
        extensions: ['vue'],
        // 配置文件生成位置
        // dts: "src/components.d.ts",
      }),
      // requireTransform({
      //   fileRegex: /.js$|.vue$/,
      // }),
      legacy({
        targets: ['chrome>=64', 'not IE 11'],
      }),
    ],
    server: {
      // 监听所有ip
      host: true,
      // 端口号
      port: env.VITE_APP_PORT,
      // 若端口已被占用则会直接退出
      strictPort: true,
      // 是否开启 https
      https: env.VITE_APP_HTTPS === 'true',
      // 服务启动时打开浏览器地址
      open: env.VITE_APP_OPEN_URL ?? '/',
      // 允许跨域
      cors: true,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        '/api': {
          target: env.VITE_API_URL,

          changeOrigin: true,
        },
      },
    },
    build: {
      // 打包文件目录
      outDir: buildOutDir,

      // ✅ 1. 修正压缩器设置
      // 你配置了 terserOptions，所以必须显式指定使用 'terser'
      minify: true,
      cssCodeSplit: true,
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1500,
      modulePreload: {
        polyfill: false,
      },
      reportCompressedSize: true,

      rollupOptions: {
        input: './index.html',
        output: {
          entryFileNames: 'static/js/[name]-[hash].js',
          chunkFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',

          // ✅ 2. 修正分包策略：解决 Circular chunk
          // eslint-disable-next-line consistent-return
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 策略调整：
              // 将 Vue 全家桶和 Element Plus 合并到一个基础库 chunk 中
              // 这样可以彻底避免它们之间的循环依赖问题
              if (
                id.includes('vue') ||
                id.includes('pinia') ||
                id.includes('router') ||
                id.includes('element-plus') ||
                id.includes('@element-plus')
              ) {
                return 'base-libs';
              }

              // 其他所有第三方库归为 vendor
              return 'vendor';
            }
          },
        },
      },
    },
    assetsInclude: ['**/*.xlsx'],
  });
};
