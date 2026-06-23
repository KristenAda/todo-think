import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type Koa from "koa";
import { createApp } from "@/createApp";

/**
 * 各业务模块至少抽一条读接口，验证未携带 Token 时统一被 JWT 中间件拦截（非 401 则测试失败便于发现白名单误配）。
 */
const PROTECTED_SAMPLES: { method: "get" | "post"; path: string }[] = [
  { method: "get", path: "/auth/info" },
  { method: "get", path: "/menu/list" },
  { method: "get", path: "/dashboard/workbench" },
  { method: "get", path: "/user/list" },
  { method: "get", path: "/role/list" },
  { method: "get", path: "/departments/tree" },
  { method: "get", path: "/projects" },
  { method: "get", path: "/tasks" },
  { method: "get", path: "/rule-sets" },
  { method: "get", path: "/messages" },
  { method: "get", path: "/attachments" },
  { method: "get", path: "/performance/stats" },
];

describe("JWT 保护（各模块抽样）", () => {
  let app: Koa;

  beforeAll(async () => {
    app = await createApp();
  });

  it.each(PROTECTED_SAMPLES)("$method $path -> 401", async ({ method, path: url }) => {
    const res = await request(app.callback())[method](url);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 401 });
  });
});
