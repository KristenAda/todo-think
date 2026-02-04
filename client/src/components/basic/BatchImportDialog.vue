<template>
  <dh-dialog ref="dialogRef">
    <div class="dialog-content">
      <c-table
        :headers="localTableHeader"
        :table-options="{ data: tableData }"
        :border="true"
        :showPagination="false"
      >
        <template
          v-for="value in otherTableHearder"
          :key="value.prop"
          #[value.prop]="scope"
        >
          <el-input
            v-if="value.type === 'input'"
            v-model="scope.data.row[value.prop]"
            size="small"
            placeholder="请输入"
            v-bind="value.props"
          ></el-input>
          <el-select
            v-else-if="value.type === 'select'"
            size="small"
            v-model="scope.data.row[value.prop]"
            placeholder="请选择"
            v-bind="value.props"
          >
            <el-option
              v-for="item in value.options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
        <template #operation="scope">
          <el-space size="large">
            <el-link type="primary" @click="addRow">添加</el-link>
            <el-link type="primary" @click="delRow(scope)">删除</el-link>
          </el-space>
        </template>
      </c-table>
    </div>
    <dh-dialog
      width="30%"
      v-if="importVisible"
      v-model="importVisible"
      title="批量上传"
      :append-to-body="true"
    >
      <div class="import">
        <DhUpload
          accept=".xlsx,.xls"
          :limit="10"
          :autoUpload="true"
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        >
        </DhUpload>
      </div>
    </dh-dialog>
    <template #footer="{ validate }">
      <div class="dialog-footer-center">
        <el-button type="primary" @click="downloadTemplate">
          模板下载
        </el-button>
        <el-button type="primary" @click="() => (importVisible = true)">
          批量上传
        </el-button>
        <el-button type="primary" @click="validateAndSubmit"> 确认 </el-button>
        <el-button @click="dialogRef.close()">取消</el-button>
      </div>
    </template>
  </dh-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormItemRule } from 'element-plus';
import { templateDownload } from '@/utils/common/templateDownload';

interface TableHeader {
  prop: string;
  label: string;
  align?: string;
  type?: 'input' | 'select';
  props?: any;
  options?: any;
  rules?: FormItemRule[];
}

interface Prop {
  tableHeader: TableHeader[];
}

const props = withDefaults(defineProps<Prop>(), {});
const dialogRef = ref();
const tableData = ref<any[]>([]);
const localTableHeader = ref<TableHeader[]>([...props.tableHeader]);
const importVisible = ref(false);
const emit = defineEmits(['confirm']);

const otherTableHearder = computed(() => {
  return localTableHeader.value.filter((item: TableHeader) => {
    return !(item.label === '操作' || item.prop === 'operation');
  });
});

const initTableRow = () => {
  const row: Record<string, any> = {};
  otherTableHearder.value.forEach((item) => {
    row[item.prop] = '';
  });
  return row;
};

function addRow() {
  for (let i = 0; i < 3000; i++) {
    tableData.value.push(initTableRow());
  }
}

function delRow(scope: any) {
  if (tableData.value.length === 1) {
    return ElMessage.warning('最后一行不能删除');
  }
  tableData.value.splice(scope.index, 1);
}

const validateTableData = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  tableData.value.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 1;

    otherTableHearder.value.forEach((header) => {
      if (!header.rules || header.rules.length === 0) return;

      for (const rule of header.rules) {
        // 必填校验
        if (
          rule.required &&
          (row[header.prop] === '' ||
            row[header.prop] === undefined ||
            row[header.prop] === null)
        ) {
          errors.push(`第${rowNum}行的【${header.label}】为必填项`);
          continue;
        }

        // 自定义校验函数
        if (rule.validator) {
          let validateError = '';
          rule.validator(
            rule,
            row[header.prop],
            (msg?: string | Error) => {
              if (msg) {
                validateError = typeof msg === 'string' ? msg : msg.message;
              }
            },
            row,
            {},
          );
          if (validateError) {
            errors.push(`第${rowNum}行的【${header.label}】：${validateError}`);
            continue;
          }
        }

        // pattern正则校验
        if (rule.pattern && row[header.prop] !== '') {
          let regExp: RegExp;
          if (typeof rule.pattern === 'string') {
            regExp = new RegExp(rule.pattern);
          } else {
            regExp = rule.pattern;
          }
          if (!regExp.test(String(row[header.prop]))) {
            const tip = rule.message || '格式不正确';
            errors.push(`第${rowNum}行的【${header.label}】：${tip}`);
            continue;
          }
        }

        // 长度校验
        if (rule.min !== undefined || rule.max !== undefined) {
          const value = String(row[header.prop]);
          if (rule.min && value.length < rule.min) {
            errors.push(
              `第${rowNum}行的【${header.label}】长度不能少于${rule.min}位`,
            );
          }
          if (rule.max && value.length > rule.max) {
            errors.push(
              `第${rowNum}行的【${header.label}】长度不能超过${rule.max}位`,
            );
          }
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

const validateAndSubmit = () => {
  const { valid, errors } = validateTableData();
  if (!valid) {
    ElMessage.warning({
      showClose: true,
      message: errors.join('，'),
      type: 'warning',
    });

    return;
  }
  emit('confirm', tableData.value);
};

const downloadTemplate = () => {
  templateDownload('test', '测试模版.xlsx');
};

function addOperationCol() {
  const hasOperationCol = localTableHeader.value.some((item: TableHeader) => {
    return item.label === '操作' || item.prop === 'operation';
  });
  if (!hasOperationCol) {
    localTableHeader.value.push({
      prop: 'operation',
      align: 'center',
      label: '操作',
    });
  }
}

function close() {
  dialogRef.value.close();
}

onMounted(() => {
  addOperationCol();
  tableData.value.push(initTableRow());
});

defineExpose({
  close,
});
</script>

<style lang="scss" scoped>
.dialog-content {
  height: 60vh;
}
.import {
  height: 30vh;
}
.dialog-footer-center {
  text-align: center;
}
:deep(.el-select__placeholder.is-transparent) {
  text-align: left;
}

:deep(.el-select__placeholder) {
  text-align: left;
}
</style>
