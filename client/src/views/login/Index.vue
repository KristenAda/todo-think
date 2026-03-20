<template>
  <div class="login-container">
    <div class="tech-background">
      <div class="grid-layer"></div>
      <div class="light-beam"></div>
      <div class="light-beam beam-2"></div>
    </div>
    <div class="login-box">
      <div class="login-header">
        <h1 class="gradient-text">Todo-Think</h1>
        <p class="subtitle">任务调度指挥中心</p>
      </div>
      <el-tabs v-model="activeTab" class="auth-tabs">
        <el-tab-pane label="登 录" name="login">
          <el-form
            v-if="activeTab === 'login'"
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loginLoading"
              block
              @click="handleLogin"
            >
              {{ loginLoading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注 册" name="register">
          <el-form
            v-if="activeTab === 'register'"
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="login-form"
            @keyup.enter="handleRegister"
          >
            <el-form-item prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="用户名（3-20字符）"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码（6+字符）"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="确认密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="邮箱（可选）"
                clearable
              />
            </el-form-item>
            <el-form-item prop="nickname">
              <el-input
                v-model="registerForm.nickname"
                placeholder="昵称（可选）"
                clearable
              />
            </el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="registerLoading"
              block
              @click="handleRegister"
            >
              {{ registerLoading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthorityStore } from '@/stores/authority';
import { loginApi, registerApi } from '@/apis/modules/auth';

const router = useRouter();
const authorityStore = useAuthorityStore();
const activeTab = ref('login');

// 登录
const loginFormRef = ref();
const loginLoading = ref(false);
const loginForm = reactive({ username: '', password: '' });
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loginLoading.value = true;
      try {
        const res = await loginApi({
          username: loginForm.username,
          password: loginForm.password,
        });
        authorityStore.authToken = res.token;
        authorityStore.loginInfo = res.user;
        authorityStore.permissions = res.permissions;
        ElMessage.success('登录成功');
        router.push('/');
      } catch (error: any) {
        console.error('Login Failed:', error);
      } finally {
        loginLoading.value = false;
      }
    }
  });
};

// 注册
const registerFormRef = ref();
const registerLoading = ref(false);
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  nickname: '',
});

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  email: [
    {
      pattern: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      registerLoading.value = true;
      try {
        await registerApi({
          username: registerForm.username,
          password: registerForm.password,
          email: registerForm.email || undefined,
          nickname: registerForm.nickname || undefined,
        });
        ElMessage.success('注册成功！请使用新账号登录');
        registerForm.username = '';
        registerForm.password = '';
        registerForm.confirmPassword = '';
        registerForm.email = '';
        registerForm.nickname = '';
        // 不再需要 clearValidate，因为 v-if 切走时表单会自动销毁并重置
        activeTab.value = 'login';
      } catch (error: any) {
        console.error('Register Failed:', error);
      } finally {
        registerLoading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
$bg-color: #0b0f19;
$primary-cyan: #00f0ff;
$primary-blue: #0057ff;
$glass-bg: rgba(16, 25, 43, 0.65);
$glass-border: rgba(0, 240, 255, 0.2);

.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: $bg-color;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .grid-layer {
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background-image:
      linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    transform: perspective(500px) rotateX(60deg) translateY(-100px)
      translateZ(-200px);
    animation: gridMove 20s linear infinite;
  }

  .light-beam {
    position: absolute;
    top: -50%;
    left: 20%;
    width: 150px;
    height: 200%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba($primary-cyan, 0.1),
      transparent
    );
    transform: rotate(35deg);
    animation: beamSweep 8s ease-in-out infinite alternate;

    &.beam-2 {
      left: 70%;
      width: 250px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba($primary-blue, 0.1),
        transparent
      );
      animation: beamSweep 12s ease-in-out infinite alternate-reverse;
    }
  }
}

.login-box {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 50px 40px;
  background: $glass-bg;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid $glass-border;
  border-radius: 12px;
  box-shadow:
    0 0 40px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba($primary-cyan, 0.05);
  animation: boxEntrance 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .gradient-text {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 10px 0;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #fff, $primary-cyan);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 1px;
    margin: 0;
  }
}

.auth-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(0, 240, 255, 0.15);
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px 8px 0 0;
    padding: 0 8px;
  }

  :deep(.el-tabs__nav-wrap) {
    &::after {
      background-color: transparent;
    }
  }

  :deep(.el-tabs__nav) {
    display: flex;
    justify-content: center;
  }

  :deep(.el-tabs__item) {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    padding: 12px 24px !important;
    margin: 4px 4px 0 4px;
    border-radius: 6px 6px 0 0;
    position: relative;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
      background-color: rgba(0, 240, 255, 0.1);
    }

    &.is-active {
      color: #fff;
      background: linear-gradient(
        135deg,
        rgba(0, 240, 255, 0.2) 0%,
        rgba(0, 87, 255, 0.1) 100%
      );
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.3) inset;
      font-weight: 700;
    }
  }

  :deep(.el-tabs__active-bar) {
    background: linear-gradient(90deg, #0057ff, #00f0ff);
    height: 3px;
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.4) !important;
    border: 1px solid rgba(0, 240, 255, 0.15) !important;
    box-shadow: none !important;
    border-radius: 6px !important;
    transition: all 0.3s ease !important;
    padding: 2px 15px !important;

    &:hover {
      background-color: rgba(0, 0, 0, 0.5) !important;
      border-color: rgba(0, 240, 255, 0.3) !important;
      box-shadow: 0 0 8px rgba(0, 240, 255, 0.2) !important;
    }

    &.is-focus {
      background-color: rgba(0, 0, 0, 0.6) !important;
      border-color: $primary-cyan !important;
      box-shadow: 0 0 15px rgba($primary-cyan, 0.4) !important;
    }
  }

  :deep(.el-input__inner) {
    color: #e0e0e0 !important;
    height: 45px !important;
    font-size: 15px !important;
    background-color: transparent !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.35) !important;
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-text-fill-color: #e0e0e0 !important;
      caret-color: #fff !important;
      /* 核心修复点 2：兜底色修改，万一极其极端的浏览器强制填充，这个颜色也刚好和你背景的高级灰暗色完美融合，绝不会有白底 */
      -webkit-box-shadow: 0 0 0px 1000px #0e1522 inset !important;
      transition:
        background-color 50000s ease-in-out 0s,
        color 50000s ease-in-out 0s !important;
      background-color: transparent !important;
      background-image: none !important;
    }
  }

  :deep(.el-input__prefix) {
    color: $primary-cyan !important;
  }

  :deep(.el-input__suffix) {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  .login-btn {
    width: 100%;
    height: 50px;
    margin-top: 20px;
    background: linear-gradient(90deg, $primary-blue, $primary-cyan);
    border: none;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba($primary-cyan, 0.5);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      transform: skewX(-20deg);
      animation: btnScan 3s infinite;
    }
  }
}

@keyframes gridMove {
  0% {
    transform: perspective(500px) rotateX(60deg) translateY(0)
      translateZ(-200px);
  }
  100% {
    transform: perspective(500px) rotateX(60deg) translateY(40px)
      translateZ(-200px);
  }
}

@keyframes beamSweep {
  0% {
    transform: rotate(35deg) translateX(-300px);
  }
  100% {
    transform: rotate(35deg) translateX(300px);
  }
}

@keyframes boxEntrance {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes btnScan {
  0% {
    left: -100%;
  }
  20% {
    left: 200%;
  }
  100% {
    left: 200%;
  }
}
</style>
