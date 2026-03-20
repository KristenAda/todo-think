<template>
  <div class="profile-container">
    <!-- 个人信息卡片 -->
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="card-header">
          <span class="title">个人信息</span>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-box">
            <el-avatar :size="120" :src="form.avatar" icon="UserFilled" />
            <el-button type="primary" size="small" @click="handleUploadAvatar">
              更换头像
            </el-button>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleAvatarChange"
          />
        </div>

        <!-- 信息表单 -->
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="info-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" disabled />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入昵称" />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" />
          </el-form-item>

          <el-form-item label="所属部门">
            <el-input v-model="form.deptName" disabled />
          </el-form-item>

          <el-form-item label="拥有角色">
            <div class="roles-display">
              <el-tag
                v-for="role in form.roles"
                :key="role.id"
                type="primary"
                size="large"
              >
                {{ role.roleName }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="创建时间">
            <el-input v-model="form.createdAt" disabled />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSave">
              保 存
            </el-button>
            <el-button @click="handleReset">重 置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useAuthorityStore } from '@/stores/authority';
import { updateUserApi } from '@/apis/modules/system/user';

const authorityStore = useAuthorityStore();
const formRef = ref();
const fileInput = ref();
const loading = ref(false);
const originalForm = reactive({
  avatar: '',
});

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: '',
  deptName: '',
  roles: [],
  createdAt: '',
});

const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    {
      pattern: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入有效的手机号',
      trigger: 'blur',
    },
  ],
};

const initForm = () => {
  const userInfo = authorityStore.loginInfo;
  if (userInfo) {
    form.username = userInfo.username || '';
    form.nickname = userInfo.nickname || '';
    form.email = userInfo.email || '';
    form.phone = userInfo.phone || '';
    form.avatar = userInfo.avatar || '';
    form.deptName = userInfo.dept?.name || '—';
    form.roles = userInfo.roles || [];
    form.createdAt = userInfo.createdAt
      ? new Date(userInfo.createdAt).toLocaleString()
      : '';
    // 保存原始头像用于重置
    originalForm.avatar = form.avatar;
  }
};

const handleUploadAvatar = () => {
  fileInput.value?.click();
};

const handleAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // 检查文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      form.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        // 准备更新数据
        const updateData = {
          id: authorityStore.loginInfo?.id,
          nickname: form.nickname,
          email: form.email || null,
          phone: form.phone || null,
          avatar: form.avatar,
        };

        // 调用更新 API
        await updateUserApi(updateData);

        // 更新本地存储的用户信息
        if (authorityStore.loginInfo) {
          authorityStore.loginInfo.nickname = form.nickname;
          authorityStore.loginInfo.email = form.email;
          authorityStore.loginInfo.phone = form.phone;
          authorityStore.loginInfo.avatar = form.avatar;
        }

        // 保存原始头像
        originalForm.avatar = form.avatar;

        ElMessage.success('个人信息更新成功');
      } catch (error: any) {
        console.error('更新失败:', error);
        ElMessage.error(error?.message || '更新失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleReset = () => {
  initForm();
};

onMounted(() => {
  initForm();
});
</script>

<style scoped lang="scss">
.profile-container {
  padding: 20px;

  .info-card {
    max-width: 800px;

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

  .profile-content {
    padding: 20px 0;

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 30px;
      border-bottom: 1px solid var(--border-color);

      .avatar-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;

        :deep(.el-avatar) {
          border: 3px solid var(--color-primary);
        }
      }
    }

    .info-form {
      :deep(.el-form-item) {
        margin-bottom: 20px;
      }

      .roles-display {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }
}
</style>
