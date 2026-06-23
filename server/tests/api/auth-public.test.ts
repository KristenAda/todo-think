import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type Koa from "koa";
import { createApp } from "@/createApp";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("认证公开接口（需 DATABASE_URL）", () => {
  let app: Koa;

  beforeAll(async () => {
    app = await createApp();
  });

  it("POST /auth/login 命中路由且非 401（业务失败可为 4xx/5xx）", async () => {
    const res = await request(app.callback()).post("/auth/login").send({
      userName: "__vitest_nonexistent_user__",
      password: "deadbeef".repeat(8),
    });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });

  it("POST /auth/register 命中路由且非 401", async () => {
    const res = await request(app.callback()).post("/auth/register").send({
      userName: `__vitest_probe_${Date.now()}__`,
      password: "abc",
      nickName: "probe",
    });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });
});
