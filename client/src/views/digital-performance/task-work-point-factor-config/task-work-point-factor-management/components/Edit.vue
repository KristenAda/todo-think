<template>
  <dh-dialog ref="dialogRef" :title="title" @opened="onOpened">
    <div class="edit-dialog-main">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="因子类型" prop="factorType">
              <el-select
                v-model="formData.factorType"
                placeholder="请选择类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="因子名称" prop="factorName">
              <el-input
                v-model="formData.factorName"
                placeholder="请输入名称"
                clearable
              />
            </el-form-item>
          </el-col>

          <template v-if="isType(FactorType.距离)">
            <el-col :span="12">
              <el-form-item label="计量单位">
                <el-input v-model="formData.measureUnit" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则阈值" prop="refValue">
                <div class="range-input-box">
                  <el-input-number
                    v-model="formData.refValue[0]"
                    :controls="false"
                    style="width: 45%"
                    placeholder="Min"
                  />
                  <span class="range-split">-</span>
                  <el-input-number
                    v-model="formData.refValue[1]"
                    :controls="false"
                    style="width: 45%"
                    placeholder="Max"
                  />
                </div>
              </el-form-item>
            </el-col>
          </template>

          <template v-else-if="isType(FactorType.超期)">
            <el-col :span="12">
              <el-form-item label="计量单位" prop="measureUnit">
                <el-select v-model="formData.measureUnit" style="width: 100%">
                  <el-option
                    v-for="item in timeUnitOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则阈值" prop="refValue">
                <el-input-number
                  v-model="formData.refValue"
                  :precision="1"
                  :min="0"
                  placeholder="正数"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </template>

          <template v-else-if="isType(FactorType.地域)">
            <el-col :span="12">
              <el-form-item label="计量单位">
                <el-input v-model="formData.measureUnit" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则阈值" prop="refValue">
                <el-select
                  v-model="formData.refValue"
                  placeholder="请选择地域"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in regionOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </template>

          <template v-else-if="isType(FactorType.时段)">
            <el-col :span="12">
              <el-form-item label="计量单位">
                <el-input v-model="formData.measureUnit" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则阈值" prop="refValue">
                <div class="range-input-box">
                  <el-time-picker
                    v-model="formData.refValue[0]"
                    placeholder="开始时间"
                    value-format="HH:mm:ss"
                    format="HH:mm:ss"
                    style="width: 45%"
                    :clearable="false"
                  />
                  <span class="range-split">至</span>
                  <el-time-picker
                    v-model="formData.refValue[1]"
                    placeholder="结束时间"
                    value-format="HH:mm:ss"
                    format="HH:mm:ss"
                    style="width: 45%"
                    :clearable="false"
                  />
                </div>
              </el-form-item>
            </el-col>
          </template>

          <template v-else-if="isType(FactorType.工序)">
            <el-col :span="12">
              <el-form-item label="计量单位" prop="measureUnit">
                <el-select v-model="formData.measureUnit" style="width: 100%">
                  <el-option
                    v-for="item in processStepOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规则阈值">
                <el-input v-model="formData.refValue" disabled />
              </el-form-item>
            </el-col>
          </template>

          <el-col :span="12">
            <el-form-item label="参考工分" prop="refScore">
              <el-input-number
                v-model="formData.refScore"
                :precision="1"
                :step="0.1"
                placeholder="支持负值"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="说明" prop="factorDesc">
              <el-input
                v-model="formData.factorDesc"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                placeholder="非必填项"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <template #footer>
      <el-button plain @click="handleCancel">取消</el-button>
      <!-- <el-button @click="reset">重置</el-button> -->
      <el-button type="primary" :loading="submitting" @click="submit"
        >保存</el-button
      >
    </template>
  </dh-dialog>
</template>

<script setup>
import { reactive, ref, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import {
  insertFactorConfig,
  updateFactorConfig,
} from '@/apis/modules/digital-performance/task-work-point-factor-config/task-work-point-factor-management';
import { FactorType } from '@/configs/enums/commons';
import {
  ProcessStep,
  RegionType,
  TimeUnit,
} from '@/configs/enums/digital-performance';
import { getEnumEntriesForElementUI } from '@/utils/common/enum-util';
import { SUCCESS_CODE } from '@/configs/const/basic';

const props = defineProps({
  info: { type: Object, default: () => ({}) },
  title: { type: String, default: '新增因子' },
});
const emits = defineEmits(['confirm', 'close']);

const dialogRef = ref();
const formRef = ref();
const submitting = ref(false);

const typeOptions = getEnumEntriesForElementUI(FactorType);
const processStepOptions = getEnumEntriesForElementUI(ProcessStep);
const regionOptions = getEnumEntriesForElementUI(RegionType);
const timeUnitOptions = getEnumEntriesForElementUI(TimeUnit);

// 表单初始数据结构
const formData = reactive({
  pOrderFactorId: undefined,
  factorType: '',
  factorName: '',
  refValue: undefined, // UI上可能是 Array 或 Number 或 String
  measureUnit: '',
  refScore: 0,
  factorDesc: '',
});

/**
 * 校验规则阈值
 */
const validateRefValue = (rule, value, callback) => {
  // 1. 通用空值校验
  if (value === undefined || value === null || value === '') {
    callback(new Error('规则阈值不能为空'));
    return;
  }

  const type = formData.factorType;

  // 2. 距离校验 (DISTANCE)
  if (type === FactorType.距离) {
    if (!Array.isArray(value) || value.length < 2) {
      callback(new Error('距离区间数据格式错误'));
      return;
    }
    const [min, max] = value;
    if (
      min === undefined ||
      max === undefined ||
      min === null ||
      max === null
    ) {
      callback(new Error('区间值不能为空'));
      return;
    }
    if (min < 0 || max < 0) {
      callback(new Error('距离不能为负数'));
      return;
    }
    if (min > max) {
      callback(new Error('起始距离不能大于结束距离'));
      return;
    }
    if (min === max) {
      callback(new Error('起始距离不能等于结束距离'));
      return;
    }
  }

  // 3. 时段校验 (TIME_PERIOD)
  else if (type === FactorType.时段) {
    if (!Array.isArray(value) || value.length < 2) {
      callback(new Error('时段数据格式错误'));
      return;
    }
    const [start, end] = value;
    if (!start || !end) {
      callback(new Error('请选择完整的时间段'));
      return;
    }
    if (start === end) {
      callback(new Error('开始时间不能等于结束时间'));
      return;
    }
    // 注：允许跨天(Start > End)，所以不做大小校验
  }

  // 4. 超期校验 (OVERDUE)
  else if (type === FactorType.超期) {
    if (typeof value !== 'number') {
      callback(new Error('请输入有效的数字'));
      return;
    }
    if (value <= 0) {
      callback(new Error('超期时间必须大于 0'));
      return;
    }
  }

  // 5. 工序校验 (PROCESS)
  else if (type === FactorType.工序) {
    if (typeof value !== 'number') {
      callback(new Error('请输入数量'));
      return;
    }
    if (value < 1) {
      callback(new Error('工序数量至少为 1'));
      return;
    }
    if (!Number.isInteger(value)) {
      callback(new Error('工序数量必须为整数'));
      return;
    }
  }

  callback();
};

/**
 * 校验参考工分
 */
const validateScore = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入参考工分'));
    return;
  }

  if (value === 0) {
    callback(new Error('工分不能为 0，若无分值则无需该因子'));
    return;
  }

  // 校验小数位数 (最多1位)
  const strVal = String(value);
  if (strVal.includes('.')) {
    const decimalPart = strVal.split('.')[1];
    if (decimalPart && decimalPart.length > 1) {
      callback(new Error('最多保留 1 位小数'));
      return;
    }
  }

  callback();
};

const rules = {
  factorType: [
    { required: true, message: '请选择因子类型', trigger: 'change' },
  ],
  factorName: [
    { required: true, message: '请输入因子名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' },
  ],
  measureUnit: [
    { required: true, message: '请选择或输入计量单位', trigger: 'change' },
  ],
  refValue: [{ required: true, validator: validateRefValue, trigger: 'blur' }],
  refScore: [{ required: true, validator: validateScore, trigger: 'blur' }],
  factorDesc: [
    { max: 200, message: '说明不能超过 200 个字符', trigger: 'blur' },
  ],
};

/**
 * 辅助函数：判断当前类型
 * 兼容 Enum 对象属性 (如 'DISTANCE') 和 值 (如 1)
 */
const isType = (key) => {
  const current = formData.factorType;
  if (current === key) return true;
  return false;
};

/**
 * 切换类型时，初始化默认值
 */
const handleTypeChange = (val) => {
  formRef.value?.clearValidate();
  switch (val) {
    case FactorType.距离:
      formData.measureUnit = 'km';
      formData.refValue = [0, 0];
      break;
    case FactorType.超期:
      formData.measureUnit = TimeUnit.分钟 || '分钟';
      formData.refValue = 0.0;
      break;
    case FactorType.地域:
      formData.measureUnit = '-';
      formData.refValue = '';
      break;
    case FactorType.时段:
      formData.measureUnit = '-';
      formData.refValue = ['08:00:00', '18:00:00'];
      break;
    case FactorType.工序:
      formData.measureUnit = ProcessStep.数量;
      formData.refValue = 1;
      break;
    default:
      formData.measureUnit = '-';
      formData.refValue = '';
      break;
  }
};

/**
 * 弹窗打开：数据回显 (String -> UI Format)
 */
const onOpened = () => {
  formRef.value?.resetFields();
  if (props.info && props.info.pOrderFactorId) {
    // 1. 分离 refValue，防止 Object.assign 直接把字符串赋值给组件导致报错
    const { refValue: rawRefValue, ...restInfo } = props.info;

    // 2. 先赋值其他字段 (此时 formData.factorType 已被正确设置)
    Object.assign(formData, restInfo);

    // 3. 根据类型解析 refValue
    let parsedRefValue = rawRefValue;
    const needArray = isType(FactorType.距离) || isType(FactorType.时段); // 需要数组的类型
    const needNumber = isType(FactorType.超期) || isType(FactorType.工序); // 需要数字的类型

    try {
      if (needArray && typeof rawRefValue === 'string') {
        // '["22:00:00", "06:00:00"]' -> ["22:00:00", "06:00:00"]
        parsedRefValue = JSON.parse(rawRefValue);
      } else if (needNumber) {
        // "30.0" -> 30
        parsedRefValue = Number(rawRefValue);
      }
    } catch (e) {
      console.warn('数据解析失败，重置为默认值', e);
      handleTypeChange(formData.factorType);
      return;
    }

    // 4. 最后安全赋值，此时类型已匹配组件要求
    formData.refValue = parsedRefValue;
  } else {
    // 新增模式
    formData.pOrderFactorId = undefined;
    formData.factorType = FactorType.距离;
    handleTypeChange(FactorType.距离);
  }
};

/**
 * 提交：数据序列化 (UI Format -> String)
 */
const submit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;

    let submitVal = formData.refValue;
    if (Array.isArray(formData.refValue)) {
      submitVal = JSON.stringify(formData.refValue);
    } else {
      submitVal = String(formData.refValue);
    }

    const payload = {
      ...formData,
      refValue: submitVal, // 覆盖为字符串
    };
    delete payload.createTime;

    const apiFunc = payload.pOrderFactorId
      ? updateFactorConfig
      : insertFactorConfig;
    const res = await apiFunc(payload);

    if (res.code === SUCCESS_CODE) {
      ElMessage.success(payload.pOrderFactorId ? '修改成功' : '新增成功');
      emits('confirm');
      dialogRef.value.close();
    }
  } catch (error) {
    console.error(error);
    // dialogRef.value.close();
  } finally {
    submitting.value = false;
  }
};

// const reset = () => {
//   if (formData.pOrderFactorId) {
//     onOpened();
//   } else {
//     formRef.value?.resetFields();
//     handleTypeChange(formData.factorType);
//   }
// };

const handleCancel = () => {
  dialogRef.value.close();
  emits('close');
};
</script>

<style lang="scss" scoped>
.edit-dialog-main {
  padding: 10px 20px;
}
.range-input-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .range-split {
    margin: 0 10px;
    color: #909399;
  }
}
</style>
