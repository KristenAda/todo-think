import Router from "@koa/router";
import c from "./attachment.controller";

const router = new Router({ prefix: "/attachments" });

router.post("/upload/init", c.init.bind(c));
router.post("/upload/chunk", c.uploadChunk.bind(c));
router.get("/upload/:uploadId/status", c.status.bind(c));
router.post("/upload/merge", c.merge.bind(c));

router.get("/", c.page.bind(c));
router.get("/:id/download", c.download.bind(c));
router.delete("/:id", c.remove.bind(c));

export default router;
