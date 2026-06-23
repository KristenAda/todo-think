import { describe, expect, it } from "vitest";
import { glob } from "glob";
import path from "path";
import { loadRoutes } from "@/routers";

describe("路由装载", () => {
  it("应扫描到全部 *.routes 模块并与 loadRoutes 挂载一致", async () => {
    const ext = path.extname(__filename);
    const pattern = path
      .join(__dirname, "..", "..", "src", "modules", "**", `*.routes${ext}`)
      .replace(/\\/g, "/");

    const files = await glob(pattern);
    expect(files.length).toBeGreaterThanOrEqual(10);

    const router = await loadRoutes();
    expect(router).toBeTruthy();
    expect(typeof router.routes).toBe("function");
  });
});
