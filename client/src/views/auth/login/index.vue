<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <div class="mb-8">
            <h3 class="title">{{ $t('login.title') }}</h3>
            <p class="sub-title">{{ $t('login.subTitle') }}</p>
          </div>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
            hide-required-asterisk
          >
            <ElFormItem prop="username" :label="$t('login.placeholder.username')">
              <ElInput
                class="custom-height login-input"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
              >
                <template #prefix>
                  <div class="icon-wrapper">
                    <ArtSvgIcon icon="solar:user-bold-duotone" class="input-icon" />
                  </div>
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="password" :label="$t('login.placeholder.password')">
              <ElInput
                class="custom-height login-input"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              >
                <template #prefix>
                  <div class="icon-wrapper">
                    <ArtSvgIcon icon="solar:lock-password-bold-duotone" class="input-icon" />
                  </div>
                </template>
              </ElInput>
            </ElFormItem>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-xl border border-transparent tad-300 shadow-sm"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-700)"
                  :successText="$t('login.sliderSuccessText')"
                  progressBarBg="var(--main-color)"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm font-medium">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink
                class="text-theme hover:underline transition-all"
                :to="{ name: 'ForgetPassword' }"
                >{{ $t('login.forgetPwd') }}</RouterLink
              >
            </div>

            <div style="margin-top: 36px; padding: 4px 4px 12px">
              <ElButton
                class="w-full btn-login"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="mt-6 text-sm text-gray-500 text-center font-medium">
              <span>{{ $t('login.noAccount') }} </span>
              <RouterLink
                class="text-theme hover:underline transition-all"
                :to="{ name: 'Register' }"
                >{{ $t('login.register') }}</RouterLink
              >
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config';
  import { useUserStore } from '@/store/modules/user';
  import { useI18n } from 'vue-i18n';
  import { HttpError } from '@/utils/http/error';
  import { fetchLogin } from '@/api/auth';
  import { hashPassword } from '@/utils/crypto';
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus';
  import { useSettingStore } from '@/store/modules/setting';
  import { ref, reactive, computed, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRouter, useRoute } from 'vue-router';

  defineOptions({ name: 'Login' });

  const settingStore = useSettingStore();
  const { isDark } = storeToRefs(settingStore);
  const { t, locale } = useI18n();
  const formKey = ref(0);

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++;
  });

  const dragVerify = ref();

  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();
  const isPassing = ref(false);
  const isClickPass = ref(false);

  const systemName = AppConfig.systemInfo.name;
  const formRef = ref<FormInstance>();

  const formData = reactive({
    username: '',
    password: '',
    rememberPassword: true
  });

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
  }));

  const loading = ref(false);

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
      const valid = await formRef.value.validate();
      if (!valid) return;

      if (!isPassing.value) {
        isClickPass.value = true;
        return;
      }

      loading.value = true;
      const { username, password } = formData;

      const { token, refreshToken } = await fetchLogin({
        userName: username,
        password: hashPassword(password)
      });

      if (!token) {
        throw new Error('Login failed - no token received');
      }

      userStore.setToken(token, refreshToken);
      userStore.setLoginStatus(true);
      showLoginSuccessNotice();

      const redirect = route.query.redirect as string;
      router.push(redirect || '/');
    } catch (error) {
      if (error instanceof HttpError) {
        // console.log(error.code)
      } else {
        console.error('[Login] Unexpected error:', error);
      }
    } finally {
      loading.value = false;
      resetDragVerify();
    }
  };

  const resetDragVerify = () => {
    dragVerify.value.reset();
  };

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      });
    }, 1000);
  };
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-form-item__label) {
    display: block;
    width: 100%;
    text-align: left;
    line-height: 1.4;
    padding-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--art-gray-800);
    letter-spacing: 0.3px;
  }

  :deep(.el-form-item) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }

  /* ---------------- 美化输入框 ---------------- */
  .custom-height {
    height: 46px !important; /* 稍微加高输入框，更显大气 */
  }

  :deep(.login-input .el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1.5px var(--art-border-color) inset;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--art-main-bg-color);
    padding: 0 14px 0 10px;

    &:hover {
      box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--main-color) 60%, transparent) inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 3px color-mix(in srgb, var(--main-color) 18%, transparent),
        0 0 0 1.5px var(--main-color) inset;
      background: color-mix(in srgb, var(--main-color) 3%, var(--art-main-bg-color));
    }
  }

  /* ================= 解决 Chrome 自动填充样式异常 ================= */
  /* 使用超长 transition-delay 阻止浏览器覆盖我们设定的背景色 */
  :deep(.el-input__inner:-webkit-autofill),
  :deep(.el-input__inner:-webkit-autofill:hover),
  :deep(.el-input__inner:-webkit-autofill:focus),
  :deep(.el-input__inner:-webkit-autofill:active) {
    -webkit-transition-delay: 99999s;
    -webkit-transition:
      color 99999s ease-out,
      background-color 99999s ease-out;
    -webkit-text-fill-color: var(--art-gray-800) !important;
  }

  /* ---------------- 彩色图标底座设计 ---------------- */
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    /* 使用主色的浅色作为背景，制造精美的彩色高亮效果 */
    background: color-mix(in srgb, var(--main-color) 12%, transparent);
    color: var(--main-color);
    margin-right: 6px;
    transition: all 0.3s ease;
  }

  /* 输入框 focus 时，图标基座跟着亮起 */
  :deep(.login-input .el-input__wrapper.is-focus) .icon-wrapper {
    background: var(--main-color);
    color: #fff;
    box-shadow: 0 2px 6px color-mix(in srgb, var(--main-color) 40%, transparent);
  }

  .input-icon {
    font-size: 18px;
  }

  /* ---------------- 登录按钮美化 ---------------- */
  .btn-login {
    height: 42px !important;
    border-radius: 7px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #fff;
    background: var(--main-color);
    border: none;
    box-shadow: 0 0 12px color-mix(in srgb, var(--main-color) 60%, transparent);
    transition: 0.5s;
    transition-property: box-shadow;

    &:hover {
      box-shadow:
        0 0 6px color-mix(in srgb, var(--main-color) 50%, transparent),
        0 0 28px color-mix(in srgb, var(--main-color) 40%, transparent),
        0 0 48px color-mix(in srgb, var(--main-color) 25%, transparent);
    }
  }
</style>
