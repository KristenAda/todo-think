<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <div class="mb-8">
            <h3 class="title">{{ $t('register.title') }}</h3>
            <p class="sub-title">{{ $t('register.subTitle') }}</p>
          </div>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            :key="formKey"
            hide-required-asterisk
            @keyup.enter="register"
          >
            <ElFormItem prop="username" :label="$t('register.placeholder.username')">
              <ElInput
                class="custom-height login-input"
                v-model.trim="formData.username"
                :placeholder="$t('register.placeholder.username')"
              >
                <template #prefix>
                  <div class="icon-wrapper">
                    <ArtSvgIcon icon="solar:user-bold-duotone" class="input-icon" />
                  </div>
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="password" :label="$t('register.placeholder.password')">
              <ElInput
                class="custom-height login-input"
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder.password')"
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

            <ElFormItem prop="confirmPassword" :label="$t('register.placeholder.confirmPassword')">
              <ElInput
                class="custom-height login-input"
                v-model.trim="formData.confirmPassword"
                :placeholder="$t('register.placeholder.confirmPassword')"
                type="password"
                autocomplete="off"
                show-password
              >
                <template #prefix>
                  <div class="icon-wrapper">
                    <ArtSvgIcon icon="solar:shield-keyhole-bold-duotone" class="input-icon" />
                  </div>
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                {{ $t('register.agreeText') }}
                <RouterLink
                  style="color: var(--theme-color); text-decoration: none"
                  to="/privacy-policy"
                  >{{ $t('register.privacyPolicy') }}</RouterLink
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 20px; padding: 4px 4px 12px">
              <ElButton
                class="w-full btn-login"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="mt-6 text-sm text-gray-500 text-center font-medium">
              <span>{{ $t('register.hasAccount') }}</span>
              <RouterLink class="text-theme hover:underline transition-all" :to="{ name: 'Login' }">{{
                $t('register.toLogin')
              }}</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import type { FormInstance, FormRules } from 'element-plus';
  import { fetchRegister } from '@/api/auth';

  defineOptions({ name: 'Register' });

  interface RegisterForm {
    username: string;
    password: string;
    confirmPassword: string;
    agreement: boolean;
  }

  const USERNAME_MIN_LENGTH = 3;
  const USERNAME_MAX_LENGTH = 20;
  const PASSWORD_MIN_LENGTH = 6;
  const REDIRECT_DELAY = 1000;

  const { t, locale } = useI18n();
  const router = useRouter();
  const formRef = ref<FormInstance>();

  const loading = ref(false);
  const formKey = ref(0);

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++;
  });

  const formData = reactive<RegisterForm>({
    username: '',
    password: '',
    confirmPassword: '',
    agreement: false
  });

  const validatePassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.placeholder.password')));
      return;
    }
    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword');
    }
    callback();
  };

  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error(t('register.rule.confirmPasswordRequired')));
      return;
    }
    if (value !== formData.password) {
      callback(new Error(t('register.rule.passwordMismatch')));
      return;
    }
    callback();
  };

  const validateAgreement = (_rule: any, value: boolean, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule.agreementRequired')));
      return;
    }
    callback();
  };

  const rules = computed<FormRules<RegisterForm>>(() => ({
    username: [
      { required: true, message: t('register.placeholder.username'), trigger: 'blur' },
      {
        min: USERNAME_MIN_LENGTH,
        max: USERNAME_MAX_LENGTH,
        message: t('register.rule.usernameLength'),
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, validator: validatePassword, trigger: 'blur' },
      { min: PASSWORD_MIN_LENGTH, message: t('register.rule.passwordLength'), trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
    agreement: [{ validator: validateAgreement, trigger: 'change' }]
  }));

  const register = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
      loading.value = true;

      const submitData = {
        userName: formData.username,
        password: formData.password
      };

      await fetchRegister(submitData);
      loading.value = false;
      toLogin();
    } catch (error) {
      console.error('表单验证或注册失败:', error);
      loading.value = false;
    }
  };

  const toLogin = () => {
    setTimeout(() => {
      router.push({ name: 'Login' });
    }, REDIRECT_DELAY);
  };
</script>

<style scoped>
  @import '../login/style.css';
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
    margin-bottom: 20px;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }

  /* ---------------- 美化输入框 ---------------- */
  .custom-height {
    height: 46px !important;
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

  /* Chrome 自动填充样式修复 */
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
    background: color-mix(in srgb, var(--main-color) 12%, transparent);
    color: var(--main-color);
    margin-right: 6px;
    transition: all 0.3s ease;
  }

  :deep(.login-input .el-input__wrapper.is-focus) .icon-wrapper {
    background: var(--main-color);
    color: #fff;
    box-shadow: 0 2px 6px color-mix(in srgb, var(--main-color) 40%, transparent);
  }

  .input-icon {
    font-size: 18px;
  }

  /* ---------------- 注册按钮美化 ---------------- */
  .btn-login {
    height: 56px;
    border-radius: 7px;
    font-size: 15px;
    font-weight: 700;
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
