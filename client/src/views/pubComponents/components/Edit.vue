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

      <SuperForm
        ref="formRef2"
        v-model="formData2"
        :schema="schema2"
        :cols="2"
        label-width="120px"
      >
        <template #footer>
          <el-button type="primary" @click="submit2">提交注册</el-button>
        </template>
      </SuperForm>
    </div>
    <template #footer>
      <el-button plain @click="handleCancel">取消</el-button>
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
  region: '',
  city: '',
  dateRange: [],
  userType: 'normal',
  vipCode: '',
  score: 0,
  unitId: '',
  userId: {},
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

const schema = [
  { type: 'section', label: '区域信息', subLabel: '这是子标题' },
  {
    label: '选择大区',
    prop: 'region',
    type: 'select',
    options: [
      { label: '中国区', value: 'cn' },
      { label: '北美区', value: 'us' },
    ],
    // 联动核心：大区变了，清空城市，并通知 Form 组件重新加载 city 的数据
    onChange: (val, model, { updateOptions }) => {
      model.city = ''; // 清空下一级
      updateOptions('city'); // 触发 city 字段的 options 重新执行
    },
  },
  {
    label: '所属城市',
    prop: 'city',
    type: 'select',
    // 异步加载：options 函数接收 formData
    options: async (model) => {
      if (!model.region) return [];
      return getCityApi(model.region);
    },
    placeholder: '请先选择大区',
  },
  {
    label: '选择单位',
    prop: 'unitId',
    type: 'choose-unit',
    props: {
      showCurrentUnit: true,
      isRadio: false,
      isChild: false,
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

  { type: 'section', label: '业务数据', subLabel: '这是子标题' },
  {
    label: '起止日期',
    prop: 'dateRange',
    type: 'date',
    // 这里 span: 24 也就是在任何屏幕下都占满整行
    span: 24,
    props: {
      type: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    label: '用户类型',
    prop: 'userType',
    type: 'radio-group',
    options: [
      { label: '普通用户', value: 'normal' },
      { label: 'VIP会员', value: 'vip' },
    ],
  },
  {
    label: 'VIP 激活码',
    prop: 'vipCode',
    type: 'input',
    // 联动显隐
    hidden: (model) => model.userType !== 'vip',
    rules: [{ required: true, message: 'VIP必填激活码' }],
  },
  {
    label: '信用评分',
    prop: 'score',
    type: 'number',
    props: { min: 0, max: 100, controlsPosition: 'right' },
  },
];

const formRef2 = ref(null);

const formData2 = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  age: 18,
  interests: [],
  website: '',
});

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

const schema2 = [
  { type: 'section', label: '账户信息', subLabel: '包含异步校验与自定义逻辑' },

  // 场景 1: 异步校验 + 正则限制
  {
    label: '用户名',
    prop: 'username',
    type: 'input',
    tip: '尝试输入 admin 看看报错',
    rules: [
      { required: true, message: '用户名不能为空', trigger: 'blur' },
      { min: 3, max: 15, message: '长度在 3 到 15 个字符', trigger: 'blur' },
      // 自定义异步校验
      { validator: validateUsernameAsync, trigger: 'blur' },
    ],
  },

  // 场景 2: 内置类型校验 (Email)
  {
    label: '电子邮箱',
    prop: 'email',
    type: 'input',
    rules: [
      { required: true, message: '请输入邮箱地址', trigger: 'blur' },
      {
        type: 'email',
        message: '请输入正确的邮箱地址',
        trigger: ['blur', 'change'],
      },
    ],
  },

  { type: 'section', label: '安全设置', subLabel: '字段间联动校验' },

  // 场景 3: 密码校验
  {
    label: '设置密码',
    prop: 'password',
    type: 'input',
    props: { type: 'password', showPassword: true },
    rules: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
    ],
  },

  // 场景 4: 确认密码 (自定义 Validator)
  {
    label: '确认密码',
    prop: 'confirmPassword',
    type: 'input',
    props: { type: 'password', showPassword: true },
    rules: [{ required: true, validator: validatePass2, trigger: 'blur' }],
  },

  { type: 'section', label: '个人资料', subLabel: '正则、范围与数组校验' },

  // 场景 5: 正则表达式 (手机号)
  {
    label: '手机号码',
    prop: 'phone',
    type: 'input',
    rules: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      // 正则校验：中国大陆手机号
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入合法的 11 位手机号',
        trigger: 'blur',
      },
    ],
  },

  // 场景 6: 数字类型与范围 (InputNumber)
  {
    label: '年龄',
    prop: 'age',
    type: 'number',
    rules: [
      { required: true, message: '年龄必填' },
      // type: 'number' 确保校验的是数字类型
      {
        type: 'number',
        min: 18,
        max: 60,
        message: '年龄必须在 18-60 岁之间',
        trigger: 'blur',
      },
    ],
  },

  // 场景 7: 数组长度校验 (Checkbox Group)
  {
    label: '兴趣爱好',
    prop: 'interests',
    type: 'checkbox-group',
    span: 24,
    options: [
      { label: '编程', value: 'coding' },
      { label: '阅读', value: 'reading' },
      { label: '运动', value: 'sports' },
      { label: '音乐', value: 'music' },
    ],
    rules: [
      {
        type: 'array',
        required: true,
        message: '请至少选择一个兴趣',
        trigger: 'change',
      },
      {
        type: 'array',
        min: 2,
        message: '请至少选择 2 项兴趣',
        trigger: 'change',
      },
    ],
  },

  // 场景 8: URL 格式校验
  {
    label: '个人主页',
    prop: 'website',
    type: 'input',
    span: 24,
    rules: [
      {
        type: 'url',
        message: '请输入合法的网址 (http://...)',
        trigger: 'blur',
      },
    ],
  },
];

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
const onOpened = () => {};

// #endregion
onMounted(() => {});
</script>

<style lang="scss" scoped></style>
