// src/modules/system/dept/dept.controller.ts
import { Context } from "koa";
import deptService from "./dept.service";
import { Result } from "@/core/result";

class DeptController {
  // POST /sys/dept/tree (获取树)
  async tree(ctx: Context) {
    const { name } = ctx.request.body as any;
    const res = await deptService.getTree({ name });
    ctx.body = res;
  }

  // POST /sys/dept/add (新增部门)
  async add(ctx: Context) {
    const data = ctx.request.body as any;
    if (!data.name) return (ctx.body = Result.error("部门名称必填"));

    const res = await deptService.add(data);
    ctx.body = Result.success(res);
  }

  // POST /sys/dept/update (修改部门，包括更换负责人)
  async update(ctx: Context) {
    const { id, ...data } = ctx.request.body as any;
    const res = await deptService.update(id, data);
    ctx.body = Result.success(res);
  }

  // POST /sys/dept/delete
  async delete(ctx: Context) {
    const { id } = ctx.request.body as any;
    try {
      await deptService.deleteDept(id);
      ctx.body = Result.success(null, "删除成功");
    } catch (e: any) {
      ctx.body = Result.error(e.message);
    }
  }

  // POST /sys/dept/employees (查看部门员工)
  async getEmployees(ctx: Context) {
    const { deptId, page = 1, pageSize = 10 } = ctx.request.body as any;
    const res = await deptService.getEmployees(deptId, page, pageSize);
    ctx.body = Result.page(res.list, res.total, page, pageSize);
  }

  // POST /sys/dept/addEmployee (添加/调动员工到该部门)
  async addEmployee(ctx: Context) {
    const { deptId, userIds } = ctx.request.body as any;
    const res = await deptService.addEmployees(deptId, userIds);
    ctx.body = res;
  }

  // POST /sys/dept/removeEmployee (移除员工，使其无部门)
  async removeEmployee(ctx: Context) {
    const { userIds } = ctx.request.body as any;
    const res = await deptService.removeEmployees(userIds);
    ctx.body = res;
  }
}

export default new DeptController();
