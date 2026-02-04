<template>
  <dh-fixed-header-table-frame>
    <div v-loading="state.loading" class="work-point-container">
      <div class="tree-section">
        <div class="common-title">
          <c-title name="任务类型">
            <template #operate>
              <el-tooltip
                effect="dark"
                content="一键初始化所有任务类型的工分标准配置，包括基准分、负责人系数等，若已设置，则跳过该项的初始化"
                placement="top-start"
              >
                <el-button
                  type="primary"
                  text
                  icon="refresh"
                  @click="handleInitConfig"
                >
                  一键初始化配置
                </el-button>
              </el-tooltip>
            </template>
          </c-title>
        </div>
        <div class="tree-wrapper">
          <el-input
            v-model="filterText"
            placeholder="输入关键字进行过滤"
            clearable
            prefix-icon="search"
            class="filter-input"
          />
          <el-tree
            ref="treeRef"
            :data="treeData"
            highlight-current
            node-key="id"
            :filter-node-method="filterNode"
            class="beautify-tree"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <i :class="getNodeIcon(node, data)" class="node-icon"></i>
                <span v-ellipsis class="node-label">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <div class="config-section">
        <div v-if="state.selectedNode" class="config-content">
          <div class="common-title">
            <c-title :name="`工分标准配置 - ${state.selectedNode.label}`" />
          </div>

          <el-card shadow="never" class="config-card">
            <el-form
              ref="formRef"
              :model="state.configForm"
              class="config-form"
              label-width="120px"
              label-suffix="："
              :rules="rules"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="基准分" prop="baseScore">
                    <el-input-number
                      v-model="state.configForm.baseScore"
                      :precision="1"
                      :step="10"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="负责人系数" prop="leaderCoeff">
                    <el-input-number
                      v-model="state.configForm.leaderCoeff"
                      :precision="2"
                      :step="0.1"
                      :min="0"
                      :max="1"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row v-if="state.configForm.updateTime" :gutter="20">
                <el-col :span="12">
                  <el-form-item label="修改时间">
                    {{ state.configForm.updateTime || '-' }}
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="备注说明" prop="remark">
                <el-input
                  v-model="state.configForm.remark"
                  type="textarea"
                  rows="3"
                />
              </el-form-item>

              <div class="form-actions">
                <el-button type="primary" icon="check" @click="handleSave">
                  保存配置
                </el-button>
                <el-button icon="refresh-left" @click="resetConfig">
                  重置
                </el-button>
              </div>
            </el-form>
          </el-card>
        </div>

        <div v-else class="empty-state">
          <el-empty
            description="请从左侧树中选择一个业务子项（任务）进行配置"
          />
        </div>
      </div>
    </div>
  </dh-fixed-header-table-frame>
</template>

<script setup>
// 引入接口
import { getTaskTree } from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-rule-config';
import {
  getWorkPointConfig,
  initWorkPointConfig,
  saveWorkPointConfig,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-standard-management';
import { SUCCESS_CODE } from '@/configs/const/basic';
import { treeConverter } from '@/utils/converter/tree-converter';
import feedback from '@/utils/feedback';

/**
 * 工分标准配置页面
 * @description 通过树形结构为业务子项配置工分标准
 */

/* ------------------  状态管理  ------------------ */
const treeRef = ref();
const filterText = ref('');
const formRef = ref();
const treeData = ref([]); // 修改为响应式数组，用于接收后端数据

const state = reactive({
  selectedNode: null, // 当前选中的末级节点
  configForm: {
    typeCode: '', // [新增] 关联的业务子项ID，接口必传
    baseScore: null, // 基准分
    leaderCoeff: null, // 负责人系数
    remark: '',
    updateTime: '', // 仅做展示用
  },
});

// 校验基准分：大于0，且最多保留1位小数
const validateBaseScore = (rule, value, callback) => {
  if (value === '' || value === undefined || value === null) {
    callback(new Error('请设置基准分'));
  } else {
    const reg = /^\d+(\.\d{1})?$/;
    if (Number(value) <= 0) {
      callback(new Error('基准分必须大于0'));
    } else if (!reg.test(value.toString())) {
      callback(new Error('基准分最多保留1位小数'));
    } else {
      callback();
    }
  }
};

// 校验负责人系数：大于0且小于1，且最多保留2位小数
const validateLeaderCoeff = (rule, value, callback) => {
  if (value === '' || value === undefined || value === null) {
    callback(new Error('请设置负责人系数'));
  } else {
    const reg = /^(0\.\d{1,2})$/;
    const num = Number(value);
    if (num <= 0 || num >= 1) {
      callback(new Error('系数必须在 0 到 1 之间（不含0和1）'));
    } else if (!reg.test(value.toString())) {
      callback(new Error('系数最多保留2位小数'));
    } else {
      callback();
    }
  }
};

// 校验规则
const rules = {
  baseScore: [
    { required: true, validator: validateBaseScore, trigger: 'blur' },
  ],
  leaderCoeff: [
    { required: true, validator: validateLeaderCoeff, trigger: 'blur' },
  ],
};
/* ------------------  方法定义  ------------------ */

/** 初始化加载树数据 */
onMounted(async () => {
  await getTreeData();
});

const getTreeData = async () => {
  state.loading = true;
  try {
    const res = await getTaskTree();
    if (res?.code === SUCCESS_CODE)
      treeData.value = treeConverter(res.data, {
        id: 'typeId',
        pid: 'parentTypeId',
        label: 'typeName',
        sorter: ['sortNum'],
      });
  } catch (e) {
    console.error(e);
    // 保留原始 Mock 数据 (树结构)
    treeData.value = [];
  } finally {
    state.loading = false;
  }
};

/** 过滤树节点 */
watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

/**
 * 根据层级返回图标
 */
const getNodeIcon = (node, data) => {
  // 根据业务逻辑调整图标
  if (data.children && data.children.length > 0) {
    return 'fa fa-folder text-warning';
  }
  return 'fa fa-file-text text-success';
};

const handleNodeClick = (data) => {
  const current = data.data;
  if (!data.children || !data.children.length) {
    state.selectedNode = { ...current, label: data.name || data.label };
    fetchConfigData(current.typeCode);
  } else {
    state.selectedNode = null;
  }
};

/** 获取配置数据 */
const fetchConfigData = async (typeCode) => {
  // 重置表单，但保留 typeCode
  resetConfig();
  state.configForm.typeCode = typeCode;

  try {
    const res = await getWorkPointConfig(typeCode);
    if (res.code === SUCCESS_CODE) {
      // 如果后端有数据，回显数据
      // 注意：确保后端返回字段与 state.configForm 一致
      state.configForm.baseScore = res.data.baseScore;
      state.configForm.leaderCoeff = res.data.leaderCoeff;
      state.configForm.remark = res.data.remark || '';
      // 如果后端返回了修改时间等额外字段，也可在此赋值
      state.configForm.updateTime = res.data.updateTime || '-';
    } else {
      // 如果没有配置过，则保持默认值，updateTime 置空
      state.configForm.updateTime = '暂无记录';
    }
  } catch (error) {
    console.error('Get config error:', error);
  }
};

const handleInitConfig = () => {
  ElMessageBox.confirm('确认一键初始化配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      feedback.loading.show('初始化中...');
      // 调用初始化接口
      const res = await initWorkPointConfig();
      if (res.code === SUCCESS_CODE) {
        ElMessage.success('配置初始化成功！');
        feedback.loading.hide();
      } else {
        ElMessage.error(res.msg || '初始化失败');
        feedback.loading.hide();
      }
    } catch (error) {
      console.error('Init error:', error);
      ElMessage.error('系统异常，请稍后再试');
      feedback.loading.hide();
    }
  });
};

/** 保存配置 */
const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        feedback.loading.show('保存中...');
        const payload = {
          typeCode: state.configForm.typeCode,
          baseScore: state.configForm.baseScore,
          leaderCoeff: state.configForm.leaderCoeff,
          remark: state.configForm.remark,
        };

        const res = await saveWorkPointConfig(payload);
        if (res.code === SUCCESS_CODE) {
          ElMessage.success('配置保存成功！');
          feedback.loading.hide();
          // 刷新数据以更新修改时间（如果后端更新了的话）
          fetchConfigData(state.configForm.typeCode);
        } else {
          ElMessage.error(res.msg || '保存失败');
          feedback.loading.hide();
        }
      } catch (error) {
        console.error('Save error:', error);
        ElMessage.error('系统异常，请稍后再试');
        feedback.loading.hide();
      }
    }
  });
};

/** 重置 */
const resetConfig = () => {
  // 仅重置表单字段，不清除 typeCode (因为还在当前选中节点下)
  const currenttypeCode = state.configForm.typeCode;
  formRef.value?.resetFields();
  state.configForm.typeCode = currenttypeCode;
  state.configForm.remark = '';
  state.configForm.updateTime = '';
};
</script>

<style scoped lang="scss">
.work-point-container {
  display: flex;
  height: 100%; // 减去头部和搜索区域高度
  gap: 20px;
  // padding: 10px;
  .common-title {
    margin: 8px 0;
  }
  .tree-section {
    width: 300px;
    background: #fff;
    border-right: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    height: 100%;

    .tree-wrapper {
      padding: 8px 4px;
      display: flex;
      flex-direction: column;
      height: calc(100% - 50px);

      .filter-input {
        margin-bottom: 8px;
      }
      .el-tree {
        overflow-y: auto;
        flex: 1;
        padding: 0 12px;
      }
    }
  }

  .config-section {
    flex: 1;
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    overflow-y: auto;

    .config-content {
      background: #fff;
      padding: 12px 20px;
      min-height: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .config-card {
        margin-top: 20px;
        border: none;
        .config-form {
          :deep(.el-form-item) {
            margin-bottom: 24px;
          }
        }
      }
    }

    .form-actions {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #dcdfe6;
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
  }
}

.beautify-tree {
  margin-top: 10px;

  // 节点样式美化
  :deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 4px;
    margin-bottom: 2px;
    transition: all 0.2s;

    &:hover {
      background-color: #f0f7ff;
      color: #409eff;
    }
  }

  // 选中项高亮
  :deep(.is-current > .el-tree-node__content) {
    background-color: #e6f1fc !important;
    color: #409eff;
    font-weight: bold;
    border-right: 3px solid #409eff;
  }
}

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
  width: 100%;

  .node-icon {
    margin-right: 10px;
    width: 16px;
    text-align: center;
  }

  // 颜色定义
  .text-primary {
    color: #409eff;
  }
  .text-warning {
    color: #e6a23c;
  }
  .text-success {
    color: #67c23a;
  }

  .node-label {
    // white-space: nowrap;
    // overflow: hidden;
    // text-overflow: ellipsis;
    max-width: calc(100% - 50px);
  }
}
</style>
