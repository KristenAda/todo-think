<template>
  <dh-dialog ref="dialogRef" @opened="onOpened">
    <div class="edit-dialog-main">
      <SuperForm
        ref="formRef"
        v-model="formData"
        :schema="schema"
        :cols="2"
        label-width="110px"
      >
      </SuperForm>

      <!-- <SuperForm
        ref="formRef2"
        v-model="formData2"
        :schema="schema2"
        :cols="2"
        label-width="120px"
      >
        
      </SuperForm> -->
    </div>
    <template #footer>
      <el-button type="info" plain @click="handleCancel">取消</el-button>
      <el-button @click="reset">重置</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </dh-dialog>
</template>

<script setup>
// #region 引用
// #endregion

// #region props/emit

const props = defineProps({
  info: {
    type: Object,
    default: () => {
      return {};
    },
  },
  tableRowData: {
    type: Object,
    default: () => {
      return {};
    },
  },
});
const emits = defineEmits(['confirm', 'remove']);
// #endregion

// #region 变量/常量

const dialogRef = ref(); // 弹窗实例对象
const state = reactive({
  list: [],
});

const formRef = ref(null);
const submitting = ref(false);

const formData = reactive({
  createTime:'',
  moduleType:'',
  reportTimeType:'',
    reportStatus: '',
    mgtOrgCode: '',
    
});

// 模拟 API
const getCityApi = async (region) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (region === 'cn')
        resolve([
          { label: '北京', value: 'bj' },
          { label: '上海', value: 'sh' },
        ]);
      else if (region === 'us')
        resolve([
          { label: '纽约', value: 'ny' },
          { label: '洛杉矶', value: 'la' },
        ]);
      else resolve([]);
    }, 1500); // 故意延迟 1.5秒 以展示 Loading 效果
  });
};

const schema =ref( [
  { type: 'section', label: '区域信息', subLabel: '这是子标题' },
  {
    label: '创建时间',
    prop: 'createTime',
    type: 'date',
     props: {
      type: 'datetime',
     placeholder: '请选择创建时间',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
  },
  {
    label: '报告类型',
    prop: 'moduleType',
    type: 'select',
    // 异步加载：options 函数接收 formData
    options: [
      { label: '月报', value: '月报' },
      { label: '周报', value: '周报' },
    ],
    events: {
      change: (val) => {
          schema.value.find((item) => item.prop === 'reportTimeType').options = []
          formData.reportTimeType = ''
      }
    },
    placeholder: '请先选择报告类型',
  },
   {
    label: '报告时间类型',
    prop: 'reportTimeType',
    type: 'select',
    // 异步加载：options 函数接收 formData
    options: [
      { label: '月报', value: '月报' },
    ],
    placeholder: '请先选择报告时间类型',
  },
   {
    label: '报告状态',
    prop: 'reportStatus',
    type: 'select',
    // 异步加载：options 函数接收 formData
    options: [
      { label: '已完成', value: '1' },
      { label: '未完成', value: '0' },
    ],
    placeholder: '请先选择报告时间状态',
  },
  {
    label: '选择单位',
    prop: 'mgtOrgCode',
    type: 'choose-unit',
    props: {
      showCurrentUnit: false,
      isRadio: true,
      isChild: false,
      modelValue:'国网成都供电公司'
    },
    events: {
      getCode: (val) => {
        console.log('val :>> ', val);
      },
      start: () => {
        console.log('start :>> ', 1);
      },
    },
  },

  {
    label: '选择用户',
    prop: 'userId',
    type: 'choose-user', // 这里调用你的自定义组件
    attrs: {
      isRadio: false,
      formProp: false,
    },
    events: {
      getInfo: (val) => {
        console.log('val2 :>> ', val);
      },
    },
  },

//   { type: 'section', label: '业务数据', subLabel: '这是子标题' },
//   {
//     label: '起止日期',
//     prop: 'dateRange',
//     type: 'date',
//     // 这里 span: 24 也就是在任何屏幕下都占满整行
//     span: 24,
//     props: {
//       type: 'daterange',
//       startPlaceholder: '开始日期',
//       endPlaceholder: '结束日期',
//       valueFormat: 'YYYY-MM-DD',
//     },
//   },
//   {
//     label: '用户类型',
//     prop: 'userType',
//     type: 'radio-group',
//     options: [
//       { label: '普通用户', value: 'normal' },
//       { label: 'VIP会员', value: 'vip' },
//     ],
//   },
//   {
//     label: 'VIP 激活码',
//     prop: 'vipCode',
//     type: 'input',
//     // 联动显隐
//     hidden: (model) => model.userType !== 'vip',
//     rules: [{ required: true, message: 'VIP必填激活码' }],
//   },
//   {
//     label: '信用评分',
//     prop: 'score',
//     type: 'number',
//     props: { min: 0, max: 100, controlsPosition: 'right' },
//   },
]);

const formRef2 = ref(null);



// --- 1. 自定义校验函数：二次密码确认 ---
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== formData.password) {
    // 核心：可以访问 formData 进行对比
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
};

// --- 2. 异步校验函数：模拟检查用户名是否已存在 ---
const validateUsernameAsync = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'));
    return;
  }
  // 模拟接口请求延迟
  setTimeout(() => {
    if (['admin', 'root', 'system'].includes(value)) {
      callback(new Error('该用户名已被系统保留，不可使用'));
    } else {
      callback();
    }
  }, 1000);
};



const submit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate();
  if (valid) {
    submitting.value = true;
    setTimeout(() => {
      submitting.value = false;
      ElMessage.success('提交成功');
    }, 1000);
  }
};

const submit2 = async () => {
  if (!formRef2.value) return;
  try {
    await formRef2.value.validate();
    ElMessage.success('校验通过，提交成功！');
  } catch (error) {
    // ElMessage.error('表单校验失败，请检查输入');
    console.error(error);
  }
};

const reset = () => {
  formRef.value.resetFields();
};

// #endregion

// #region 业务方法
// 3. 方法

/**
 * 取消
 */
const handleCancel = () => {
  dialogRef.value.close();
};

/**
 * 弹窗打开事件
 */
const initFormData=()=>{
    // formData = props.tableRowData;
    formData.createTime = props.tableRowData.createTime;
    formData.moduleType = props.tableRowData.moduleType;
    formData.reportTimeType = props.tableRowData.reportTimeType;
    formData.reportStatus = props.tableRowData.reportStatus;

    console.log('formatData :>> ', formData,props.tableRowData);
}
const onOpened = () => {
    initFormData()
};

// #endregion
onMounted(() => {});
</script>

<style lang="scss" scoped></style>
