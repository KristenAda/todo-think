-- CreateIndex
CREATE INDEX `project_orgId_id_idx` ON `project`(`orgId`, `id`);

-- CreateIndex
CREATE INDEX `task_orgId_id_idx` ON `task`(`orgId`, `id`);

-- CreateIndex
CREATE INDEX `task_projectId_status_id_idx` ON `task`(`projectId`, `status`, `id`);

-- CreateIndex
CREATE INDEX `task_mainAssigneeId_id_idx` ON `task`(`mainAssigneeId`, `id`);
