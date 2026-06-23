import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup-env.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "tests/scenario/**"],
    fileParallelism: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // 动态 require 的 *.routes.ts 内含无扩展名导入，需由 tsx 参与解析（与开发态 tsx watch 一致）
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--import", "tsx"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["@koa/router", "koa"],
  },
});
