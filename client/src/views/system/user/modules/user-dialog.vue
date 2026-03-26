<template>
  <ArtDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    icon="solar:user-bold-duotone"
    width="500px"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <!-- 头像上传 -->
      <ElFormItem label="头像">
        <div class="avatar-upload-wrap">
          <ElUpload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <div class="avatar-preview">
              <img v-if="formData.avatar" :src="formData.avatar" class="avatar-img" />
              <div v-else class="avatar-placeholder">
                <el-icon :size="28" color="#c0c4cc"><Plus /></el-icon>
                <span class="placeholder-text">上传头像</span>
              </div>
              <div class="avatar-mask">
                <el-icon :size="20" color="#fff"><Camera /></el-icon>
              </div>
            </div>
          </ElUpload>
          <div class="avatar-tip">支持 JPG / PNG / GIF / WebP，不超过 2MB</div>
        </div>
      </ElFormItem>

      <ElFormItem label="用户名" prop="userName">
        <ElInput v-model="formData.userName" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="userPhone">
        <ElInput v-model="formData.userPhone" placeholder="请输入手机号" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="userEmail">
        <ElInput v-model="formData.userEmail" placeholder="请输入邮箱" />
      </ElFormItem>
      <ElFormItem label="性别" prop="userGender">
        <ElSelect v-model="formData.userGender">
          <ElOption label="男" value="男" />
          <ElOption label="女" value="女" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickName">
        <ElInput v-model="formData.nickName" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="角色" prop="userRoles">
        <ElSelect v-model="formData.userRoles" multiple>
          <ElOption
            v-for="role in roleList"
            :key="role.roleCode"
            :value="role.roleCode"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="loading">提交</ElButton>
      </div>
    </template>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { fetchGetRoleList, fetchAddUser, fetchUpdateUser } from '@/api/system-manage';
  import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
  import { Plus, Camera } from '@element-plus/icons-vue';

  interface Props {
    visible: boolean;
    type: string;
    userData?: Partial<Api.SystemManage.UserListItem>;
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'submit'): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // 角色列表数据
  const roleList = ref<Api.SystemManage.RoleListItem[]>([]);

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  });

  const dialogType = computed(() => props.type);

  // 表单实例
  const formRef = ref<FormInstance>();

  // 加载状态
  const loading = ref(false);

  // 表单数据
  const formData = reactive({
    id: undefined as number | undefined,
    userName: '',
    userPhone: '',
    userEmail: '',
    userGender: '男',
    nickName: '',
    userRoles: [] as string[],
    avatar: '' as string
  });

  // 表单验证规则
  const rules: FormRules = {
    userName: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    userPhone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    userEmail: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
    userGender: [{ required: true, message: '请选择性别', trigger: 'blur' }],
    userRoles: [{ required: true, message: '请选择角色', trigger: 'blur' }]
  };

  /**
   * 头像上传前校验并转 base64
   */
  const beforeAvatarUpload = (rawFile: UploadRawFile): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(rawFile.type)) {
      ElMessage.error('头像只能上传 JPG / PNG / GIF / WebP 格式！');
      return false;
    }
    if (rawFile.size / 1024 / 1024 > 2) {
      ElMessage.error('头像大小不能超过 2MB！');
      return false;
    }
    // 读取为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(rawFile);
    // 返回 false 阻止默认上传行为（我们用 base64 自行处理）
    return false;
  };

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData;
    const row = props.userData;

    Object.assign(formData, {
      id: isEdit && row ? row.id : undefined,
      userName: isEdit && row ? row.userName || '' : '',
      userPhone: isEdit && row ? row.userPhone || '' : '',
      userEmail: isEdit && row ? row.userEmail || '' : '',
      userGender: isEdit && row ? row.userGender || '男' : '男',
      nickName: isEdit && row ? row.nickName || '' : '',
      userRoles: isEdit && row ? (Array.isArray(row.userRoles) ? row.userRoles : []) : [],
      avatar: isEdit && row ? row.avatar || '' : ''
    });
  };

  /**
   * 加载角色列表
   */
  const loadRoleList = async () => {
    try {
      const res = await fetchGetRoleList({ current: 1, size: 1000 });
      if (res && (res as any).list) {
        roleList.value = (res as any).list;
      } else if (Array.isArray(res)) {
        roleList.value = res;
      }
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData();
        loadRoleList();
        nextTick(() => {
          formRef.value?.clearValidate();
        });
      }
    },
    { immediate: true }
  );

  /**
   * 提交表单
   * 验证通过后调用 API 保存数据
   */
  const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
      loading.value = true;

      // 将 roleCode 数组转换为 roleId 数组
      const selectedRoleIds = formData.userRoles
        .map((code) => roleList.value.find((r) => r.roleCode === code)?.roleId)
        .filter((id): id is number => id !== undefined);

      const submitData = {
        id: formData.id,
        userName: formData.userName,
        userPhone: formData.userPhone,
        userEmail: formData.userEmail,
        userGender: formData.userGender,
        nickName: formData.nickName,
        avatar: formData.avatar || undefined,
        roleIds: selectedRoleIds
      };

      if (props.type === 'add') {
        await fetchAddUser(submitData);
        ElMessage.success('添加成功');
      } else {
        await fetchUpdateUser(submitData);
        ElMessage.success('更新成功');
      }

      dialogVisible.value = false;
      emit('submit');
    } catch (error) {
      console.error('提交失败:', error);
      ElMessage.error('提交失败，请重试');
    } finally {
      loading.value = false;
    }
  };
</script>

<style scoped lang="scss">
  .avatar-upload-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;

    .avatar-uploader {
      :deep(.el-upload) {
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
      }
    }

    .avatar-preview {
      position: relative;
      width: 88px;
      height: 88px;
      border-radius: 8px;
      border: 1px dashed var(--el-border-color);
      overflow: hidden;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--el-color-primary);

        .avatar-mask {
          opacity: 1;
        }
      }

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-lighter);
        gap: 4px;

        .placeholder-text {
          font-size: 12px;
          color: var(--el-text-color-placeholder);
          line-height: 1;
        }
      }

      .avatar-mask {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .avatar-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.4;
    }
  }
</style>
