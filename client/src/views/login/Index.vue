<template>
  <div class="login-container">
    <div class="tech-background">
      <div class="grid-layer"></div>
      <div class="light-beam"></div>
      <div class="light-beam beam-2"></div>
      <div class="floating-node node-1"></div>
      <div class="floating-node node-2"></div>
      <div class="floating-node node-3"></div>
    </div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">
          <div class="hexagon">
            <span class="inner-t">T</span>
          </div>
        </div>
        <h1 class="gradient-text">Todo-Think</h1>
        <p class="subtitle">任务调度指挥中心</p>
      </div>

      <el-form
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
            class="tech-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="访问密码"
            :prefix-icon="Lock"
            show-password
            class="tech-input"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <span class="btn-text">{{ loading ? '登录中...' : '登录' }}</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthorityStore } from '@/stores/authority';
// 假设你有一个封装好的 api 请求方法，这里模拟引入
import { loginApi } from '@/apis/modules/auth';

const router = useRouter();
const authorityStore = useAuthorityStore();

const loginFormRef = ref();
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
});

const loginRules = {
  username: [{ required: true, message: '请输入系统账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入访问密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        // 调用真实的登录接口
        const res = await loginApi({
          username: loginForm.username,
          password: loginForm.password,
        });

        // request-util.js 拦截器已经帮你把后端的 Result.data 解构出来了
        // 直接将返回的数据存入 Pinia 状态管理
        authorityStore.authToken = res.token;
        authorityStore.loginInfo = res.user;
        authorityStore.permissions = res.permissions;

        ElMessage.success({
          message: '系统验证通过，欢迎回来。',
          grouping: true,
        });

        // 跳转到系统主页
        router.push('/');
      } catch (error: any) {
        // 请求失败已经在 request-util.js 统一处理拦截并弹出 ElMessage 提示，
        // 这里只需在控制台打印排查，或执行特定的失败交互。
        console.error('Login Failed:', error);
      } finally {
        // 无论成功失败，重置 Loading 状态
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
/* --- 核心主题色变量 --- */
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
  font-family:
    'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

/* --- 背景与环境特效 --- */
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  /* 赛博朋克网格底纹 */
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

  /* 扫描光束 */
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

  /* 悬浮的任务节点特效 */
  .floating-node {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: $primary-cyan;
    border-radius: 50%;
    box-shadow: 0 0 15px 3px rgba($primary-cyan, 0.8);
    opacity: 0.6;
    animation: floatNode 6s ease-in-out infinite;

    &.node-1 {
      top: 20%;
      left: 15%;
      animation-delay: 0s;
    }
    &.node-2 {
      top: 70%;
      left: 85%;
      animation-delay: -2s;
      width: 5px;
      height: 5px;
    }
    &.node-3 {
      top: 80%;
      left: 25%;
      animation-delay: -4s;
      width: 12px;
      height: 12px;
    }
  }
}

/* --- 登录面板 (毛玻璃科技风) --- */
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
  transform: translateY(0);
  animation: boxEntrance 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  /* 纯 CSS 科技感 Logo */
  .logo-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;

    .hexagon {
      position: relative;
      width: 60px;
      height: 34.64px;
      background-color: rgba($primary-cyan, 0.1);
      border-left: 2px solid $primary-cyan;
      border-right: 2px solid $primary-cyan;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba($primary-cyan, 0.3);

      &::before,
      &::after {
        content: '';
        position: absolute;
        z-index: -1;
        width: 42.43px;
        height: 42.43px;
        transform: scaleY(0.5774) rotate(-45deg);
        background-color: inherit;
        left: 6.79px;
      }
      &::before {
        top: -21.21px;
        border-top: 2.83px solid $primary-cyan;
        border-right: 2.83px solid $primary-cyan;
      }
      &::after {
        bottom: -21.21px;
        border-bottom: 2.83px solid $primary-cyan;
        border-left: 2.83px solid $primary-cyan;
      }

      .inner-t {
        color: #fff;
        font-size: 28px;
        font-weight: 900;
        text-shadow: 0 0 10px $primary-cyan;
        z-index: 2;
      }
    }
  }

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

/* --- Element Plus 深度样式覆盖 (适配科技风) --- */
.login-form {
  :deep(.el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
    border-radius: 4px;
    transition: all 0.3s ease;
    padding: 2px 15px;

    &:hover,
    &.is-focus {
      border-color: $primary-cyan;
      box-shadow: 0 0 10px rgba($primary-cyan, 0.3);
      background-color: rgba(0, 0, 0, 0.5);
    }
  }

  :deep(.el-input__inner) {
    color: #e0e0e0;
    height: 45px;
    font-size: 15px;
    letter-spacing: 1px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  :deep(.el-input__inner) {
    // 针对自动填充状态进行强制覆盖
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      // 1. 使用内阴影覆盖掉 Chrome 的白色背景。这里使用深色 #0d1117 或 #0b0f19
      -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;

      // 2. 强制设置文字颜色为你的 $primary-cyan 或白色
      -webkit-text-fill-color: #e0e0e0 !important;

      // 3. 这里的动画技巧是为了防止 Chrome 瞬间切回原始样式
      transition: background-color 5000s ease-in-out 0s;

      // 4. 保持光标可见
      caret-color: #fff;
    }
  }

  // 确保容器背景在自动填充时也不会变白
  :deep(.el-input__wrapper) {
    &.is-focus,
    &:hover {
      background-color: rgba(0, 0, 0, 0.5) !important;
    }
  }

  :deep(.el-input__prefix) {
    color: $primary-cyan;
    font-size: 18px;
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
    transition:
      transform 0.2s,
      box-shadow 0.2s;

    .btn-text {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 2px;
      color: #fff;
      z-index: 1;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba($primary-cyan, 0.5);
    }

    /* 按钮扫描高光动画 */
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

/* --- 关键帧动画 --- */
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

@keyframes floatNode {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
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
