<template>
  <dh-fixed-header-table-frame>
    <div v-loading="state.loading" class="main-layout">
      <div class="tree-section">
        <div class="common-title">
          <c-title name="任务类型" />
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

      <div class="content-area">
        <div v-if="selectedTask" class="task-config">
          <div class="header-action">
            <div class="left-tools">
              <c-title :name="`${selectedTask.label} - 关联因子列表`" />
              <el-checkbox
                v-if="associatedFactors.length"
                v-model="isAllSelected"
                :indeterminate="isIndeterminate"
                style="margin-left: 0px"
                @change="handleSelectAll"
                >全选</el-checkbox
              >
            </div>
            <div class="right-buttons">
              <el-button type="primary" icon="plus" @click="showChoosePop"
                >关联因子</el-button
              >
            </div>
          </div>

          <div v-if="associatedFactors.length" class="center-action">
            <el-row :gutter="16" class="factor-grid">
              <el-col
                v-for="item in associatedFactors"
                :key="item.pOrderFactorId"
                :span="8"
              >
                <el-card class="factor-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <el-checkbox
                        :model-value="
                          state.selection.includes(item.pOrderFactorId)
                        "
                        @change="
                          (val) => handleSelectCard(val, item.pOrderFactorId)
                        "
                      />
                      <el-tag
                        size="small"
                        :type="getTagType(item.factorType)"
                        >{{ FactorType[item.factorType] }}</el-tag
                      >
                      <span class="title">{{ item.factorName }}</span>
                      <el-button
                        type="danger"
                        link
                        icon="delete"
                        @click="handleRemove(item)"
                        >移除</el-button
                      >
                    </div>
                  </template>

                  <div class="card-body">
                    <div class="info-row">
                      <span>
                        规则阈值：
                        <span>{{ formatRefValue(item) }}</span>
                      </span>
                    </div>

                    <div class="info-row">
                      <span v-if="item.factorType !== FactorType.超期">
                        计量单位： <b>{{ item.measureUnit }}</b>
                      </span>
                      <span v-else>
                        计量单位： <b>{{ TimeUnit[item.measureUnit] }}</b>
                      </span>
                      <span>
                        参考工分：
                        <b class="text-blue">{{ item.refScore }}</b>
                      </span>
                    </div>

                    <div class="edit-row">
                      <span class="label">实际工分：</span>
                      <el-input-number
                        v-model="item.actualScore"
                        :precision="1"
                        size="small"
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <el-empty
            v-if="!associatedFactors.length"
            description="暂无关联因子，请点击上方按钮添加"
          />

          <div v-if="associatedFactors.length" class="footer-action">
            <el-button
              type="danger"
              plain
              icon="delete"
              :disabled="!state.selection?.length"
              @click="handleBatchRemove"
              >批量移除关联因子</el-button
            >
            <el-button type="primary" plain icon="Promotion" @click="handleSave"
              >确认修改</el-button
            >
          </div>
        </div>

        <div v-else class="empty-holder">
          <el-empty description="请选择左侧业务子项进行工分配置" />
        </div>
      </div>
    </div>

    <choose-factor
      v-if="popVisible"
      v-model="popVisible"
      :type-code="state.choose.typeCode"
      :factor-list="associatedFactors"
      width="1000px"
      @confirm="handleBind"
    />
  </dh-fixed-header-table-frame>
</template>

<script setup>
import {
  getTaskAssociatedFactors,
  unbindFactors,
  saveActualScores,
  getTaskTree,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-rule-config';
import { treeConverter } from '@/utils/converter/tree-converter';
import { FactorType } from '@/configs/enums/commons';
import { RegionType, TimeUnit } from '@/configs/enums/digital-performance';
import { SUCCESS_CODE } from '@/configs/const/basic';
import ChooseFactor from './components/ChooseFactor.vue';

// 树结构配置
const defaultProps = {
  children: 'children',
  label: 'label',
};
const treeData = ref([]);
const treeRef = ref(null);
const filterText = ref('');

// 过滤树节点
watch(filterText, (val) => {
  treeRef.value?.filter(val);
});
const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.includes(value);
};

const state = reactive({
  loading: false,
  choose: {
    typeCode: null,
  },
  selection: [],
});

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

const getTagType = (type) => {
  const map = {
    DISTANCE: '',
    OVERDUE: 'danger',
    REGION: 'success',
    TIME_PERIOD: 'warning',
    PROCESS: 'info',
  };
  return map[type] || '';
};

const selectedTask = ref(null);
const associatedFactors = ref([]);
const popVisible = ref(false);

// 初始化加载树
onMounted(async () => {
  getTreeData();
});

const getTreeData = async () => {
  state.loading = true;
  try {
    const res = await getTaskTree();
    if (res.code === SUCCESS_CODE) {
      treeData.value = treeConverter(res.data, {
        id: 'typeId',
        pid: 'parentTypeId',
        label: 'typeName',
        sorter: ['sortNum'],
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    state.loading = false;
  }
};

const handleNodeClick = (data) => {
  if (!data.children || data.children.length === 0) {
    selectedTask.value = { ...data.data, label: data.name || data.label };
    loadFactors(data.data.typeCode);
  } else {
    selectedTask.value = null;
  }
};

const loadFactors = async (typeCode) => {
  state.loading = true;
  state.selection = [];
  try {
    const res = await getTaskAssociatedFactors(typeCode);
    if (res.code === SUCCESS_CODE) {
      // 处理后端数据，确保 actualScore 存在
      associatedFactors.value = (res.data || []).map((item) => ({
        ...item,
        actualScore: parseFloat(item.actualScore) || parseFloat(item.refScore),
      }));
      console.log('associatedFactors.value :>> ', associatedFactors.value);
    }
  } catch (e) {
    console.error(e);
  } finally {
    state.loading = false;
  }
};

const showChoosePop = () => {
  state.choose.typeCode = selectedTask.value.typeCode;
  popVisible.value = true;
};

// 绑定因子 (支持选择多个)
const handleBind = async () => {
  loadFactors(selectedTask.value.typeCode);
};

// 单个移除
const handleRemove = (item) => {
  ElMessageBox.confirm(`确定要移除因子 "${item.factorName}" 吗？`, '提示').then(
    async () => {
      // 使用 pOrderFactorId
      const res = await unbindFactors({
        typeCode: selectedTask.value.typeCode,
        factorIds: [item.pOrderFactorId],
      });
      if (res.code === SUCCESS_CODE) {
        ElMessage.success('移除成功');
        loadFactors(selectedTask.value.typeCode);
      }
    },
  );
};

// 批量移除
const handleBatchRemove = () => {
  ElMessageBox.confirm(
    `确认要一键移除选中的 ${state.selection.length} 项因子吗？`,
    '批量操作',
    { type: 'warning' },
  ).then(async () => {
    // selection 中存储的是 pOrderFactorId
    const res = await unbindFactors({
      typeCode: selectedTask.value.typeCode,
      factorIds: state.selection,
    });
    if (res.code === SUCCESS_CODE) {
      ElMessage.success('批量移除成功');
      loadFactors(selectedTask.value.typeCode);
    }
  });
};

const handleSave = async () => {
  const updateData = associatedFactors.value.map((item) => ({
    pOrderFactorId: item.pOrderFactorId,
    actualScore: item.actualScore,
  }));
  const res = await saveActualScores({
    typeCode: selectedTask.value.typeCode,
    updateData,
  }).catch((err) => {
    console.error('保存失败:', err);
  });
  if (res.code === SUCCESS_CODE) {
    ElMessage.success('分值已同步');
  }
};

// // 更新实际工分
// const updateScore = async (item, val) => {
//   // 验证实际工分是否大于0
//   if (val === 0) {
//     ElMessage.error('实际工分不能等于0');
//     return;
//   }
//   try {
//     // 使用 pOrderFactorId
//     const res = await saveActualScores({
//       typeCode: selectedTask.value.typeCode,
//       updateData: [
//         {
//           pOrderFactorId: item.pOrderFactorId,
//           actualScore: val,
//         },
//       ],
//     });
//     if (res.code === SUCCESS_CODE) {
//       ElMessage.success('分值已同步');
//     }
//   } catch (e) {
//     console.error(e);
//   }
// };

/**
 * 格式化规则阈值显示逻辑
 * @param item 因子对象
 */
const formatRefValue = (item) => {
  const { factorType: type, refValue: val } = item;

  if (!val) return '-';

  if (
    ['DISTANCE', 'TIME_PERIOD', FactorType.距离, FactorType.时段].includes(type)
  ) {
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      if (Array.isArray(parsed)) {
        return `[${parsed.join(' - ')}]`;
      }
    } catch (e) {
      return val;
    }
  }

  if (FactorType.地域 === type) {
    return RegionType[val] || val;
  }

  return val;
};

// 全选状态计算
const isAllSelected = ref(false);
const isIndeterminate = computed(() => {
  return (
    state.selection.length > 0 &&
    state.selection.length < associatedFactors.value.length
  );
});

// 单选卡片
const handleSelectCard = (val, id) => {
  // id 对应 pOrderFactorId
  if (val) {
    state.selection.push(id);
  } else {
    state.selection = state.selection.filter((item) => item !== id);
  }
  isAllSelected.value =
    state.selection.length === associatedFactors.value.length;
};

// 全选操作
const handleSelectAll = (val) => {
  state.selection = val
    ? associatedFactors.value.map((item) => item.pOrderFactorId)
    : [];
};
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100%;
  gap: 20px;
  padding: 10px;
  .tree-section {
    width: 312px;
    background: #fff;
    border-right: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    padding-right: 8px;

    .tree-wrapper {
      padding: 8px 4px;
      display: flex;
      flex-direction: column;
      height: calc(100% - 40px);

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
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-bottom: 12px;
    .task-config {
      flex: 1;
      background: #fff;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }
  }
}

.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fb;
  border-radius: 6px;
  .common-title {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
  .left-tools {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
}

.footer-action {
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px dashed #dcdfe6;
  padding-top: 12px;
}
.center-action {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100% - 120px);
}

.factor-card {
  margin-bottom: 16px;
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 35px;
    .title {
      flex: 1;
      font-weight: bold;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .card-body {
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #666;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .edit-row {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #ebeef5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .label {
        font-weight: bold;
        color: #409eff;
      }
    }
  }
}
.text-blue {
  color: #409eff;
}
.empty-holder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beautify-tree {
  margin-top: 10px;
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
  .text-success {
    color: #67c23a;
  }
  .text-warning {
    color: #e6a23c;
  }
  .node-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 50px);
  }
}
</style>
