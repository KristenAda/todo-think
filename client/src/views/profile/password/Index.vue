<template>
  <div class="password-container">
    <!-- 修改密码卡片 -->
    <el-card shadow="never" class="password-card">
      <template #header>
        <div class="card-header">
          <span class="title">修改密码</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
          <div class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="passwordStrength.class"
                :style="{ width: passwordStrength.percent }"
              />
            </div>
            <span class="strength-text">{{ passwordStrength.text }}</span>
          </div>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            确 定
          </el-button>
          <el-button @click="handleReset">重 置</el-button>
        </el-form-item>
      </el-form>

      <!-- 密码要求提示 -->
      <div class="password-tips">
        <div class="tips-title">密码要求：</div>
        <ul>
          <li>长度至少 6 个字符</li>
          <li>建议包含大小写字母、数字和特殊符号</li>
          <li>不能与当前密码相同</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const formRef = ref();
const loading = ref(false);

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'));
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const validateNewPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入新密码'));
  } else if (value.length < 6) {
    callback(new Error('密码长度至少 6 个字符'));
  } else if (value === form.oldPassword) {
    callback(new Error('新密码不能与当前密码相同'));
  } else {
    callback();
  }
};

const rules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
};

const passwordStrength = computed(() => {
  const pwd = form.newPassword;
  if (!pwd) return { percent: '0%', class: '', text: '' };

  let strength = 0;
  if (pwd.length >= 6) strength++;
  if (pwd.length >= 8) strength++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
  if (/\d/.test(pwd)) strength++;
  if (/[!@#$%^&*]/.test(pwd)) strength++;

  const strengthMap = [
    { percent: '20%', class: 'weak', text: '弱' },
    { percent: '40%', class: 'fair', text: '一般' },
    { percent: '60%', class: 'good', text: '中等' },
    { percent: '80%', class: 'strong', text: '强' },
    { percent: '100%', class: 'very-strong', text: '非常强' },
  ];

  return strengthMap[Math.min(strength - 1, 4)];
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        // TODO: 调用修改密码 API
        ElMessage.success('密码修改成功，请重新登录');
        // 重定向到登录页
        // router.push('/login');
      } catch (error) {
        console.error('修改失败:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleReset = () => {
  form.oldPassword = '';
  form.newPassword = '';
  form.confirmPassword = '';
  formRef.value?.clearValidate();
};
</script>

<style scoped lang="scss">
.password-container {
  padding: 20px;

  .password-card {
    max-width: 600px;

    :deep(.el-card__header) {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .card-header {
      display: flex;
      align-items: center;

      .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color-primary);
      }
    }
  }

  .password-form {
    padding: 20px 0;

    :deep(.el-form-item) {
      margin-bottom: 24px;
    }

    .password-strength {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 12px;

      .strength-bar {
        flex: 1;
        height: 4px;
        background-color: var(--border-color);
        border-radius: 2px;
        overflow: hidden;

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;

          &.weak {
            background-color: #ff6b6b;
          }

          &.fair {
            background-color: #ffb84d;
          }

          &.good {
            background-color: #ffd666;
          }

          &.strong {
            background-color: #95de64;
          }

          &.very-strong {
            background-color: #00d4aa;
          }
        }
      }

      .strength-text {
        font-size: 12px;
        color: var(--text-color-secondary);
        min-width: 40px;
      }
    }
  }

  .password-tips {
    padding: 16px;
    background-color: var(--fill-color-light);
    border-radius: 6px;
    margin-top: 20px;

    .tips-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color-primary);
      margin-bottom: 8px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      list-style: disc;

      li {
        font-size: 13px;
        color: var(--text-color-secondary);
        line-height: 1.8;
      }
    }
  }
}
</style>
