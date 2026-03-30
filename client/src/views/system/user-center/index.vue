<template>
  <div class="uc-wrapper">
    <!-- 左侧卡片 -->
    <aside class="uc-aside">
      <div class="uc-cover">
        <img src="@imgs/user/bg.webp" class="uc-cover__bg" alt="cover" />
        <div class="uc-cover__overlay" />
      </div>
      <div class="uc-profile">
        <div class="uc-avatar-wrap">
          <el-avatar :size="80" :src="profile.avatar || ''" class="uc-avatar">
            <art-svg-icon icon="mdi:account" style="font-size: 40px" />
          </el-avatar>
          <el-upload
            class="uc-avatar-upload"
            :show-file-list="false"
            accept="image/*"
            :before-upload="handleAvatarUpload"
          >
            <div class="uc-avatar-edit"><art-svg-icon icon="mdi:camera" /></div>
          </el-upload>
        </div>
        <h2 class="uc-profile__name">{{ profile.nickName || profile.userName }}</h2>
        <p class="uc-profile__username">@{{ profile.userName }}</p>
        <div class="uc-profile__roles">
          <el-tag
            v-for="r in profile.roles"
            :key="r.roleCode"
            size="small"
            type="primary"
            effect="plain"
            >{{ r.roleName }}</el-tag
          >
        </div>
        <div class="uc-profile__meta">
          <div class="meta-row" v-if="profile.userEmail">
            <art-svg-icon icon="mdi:email-outline" class="meta-icon" /><span>{{
              profile.userEmail
            }}</span>
          </div>
          <div class="meta-row" v-if="profile.userPhone">
            <art-svg-icon icon="mdi:cellphone" class="meta-icon" /><span>{{
              profile.userPhone
            }}</span>
          </div>
          <div class="meta-row" v-if="profile.userGender">
            <art-svg-icon icon="mdi:gender-male-female" class="meta-icon" /><span>{{
              profile.userGender
            }}</span>
          </div>
          <div class="meta-row" v-if="profile.createTime">
            <art-svg-icon icon="mdi:calendar-account" class="meta-icon" /><span
              >加入于 {{ formatDate(profile.createTime) }}</span
            >
          </div>
        </div>
        <!-- <div class="uc-profile__remark" v-if="profile.remark">
          <art-svg-icon icon="mdi:format-quote-open" class="quote-icon" />{{ profile.remark }}
        </div> -->
        <div class="uc-profile__tags" v-if="profile.tags && profile.tags.length">
          <div class="tags-title"
            ><art-svg-icon icon="mdi:tag-multiple" class="tag-icon" />个人标签</div
          >
          <div class="tags-list">
            <el-tag
              v-for="tag in profile.tags"
              :key="tag"
              size="small"
              effect="plain"
              round
              class="profile-tag"
              >{{ tag }}</el-tag
            >
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <main class="uc-main">
      <!-- 基本信息 -->
      <div class="uc-card">
        <div class="uc-card__header">
          <div class="uc-card__title">
            <art-svg-icon icon="mdi:account-edit" class="title-icon" /><span>基本信息</span>
          </div>
          <el-button v-if="!isEditInfo" type="primary" plain size="small" @click="startEditInfo">
            <art-svg-icon icon="mdi:pencil" style="margin-right: 4px" />编辑
          </el-button>
          <div v-else class="uc-card__actions">
            <el-button size="small" @click="cancelEditInfo">取消</el-button>
            <el-button type="primary" size="small" :loading="savingInfo" @click="saveInfo"
              >保存</el-button
            >
          </div>
        </div>
        <el-form
          ref="infoFormRef"
          :model="infoForm"
          :rules="infoRules"
          label-position="top"
          class="uc-form"
        >
          <div class="uc-form__grid">
            <el-form-item label="昵称" prop="nickName">
              <el-input
                v-model="infoForm.nickName"
                :disabled="!isEditInfo"
                placeholder="请输入昵称"
              />
            </el-form-item>
            <el-form-item label="性别" prop="userGender">
              <el-select
                v-model="infoForm.userGender"
                :disabled="!isEditInfo"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="男" value="男" /><el-option label="女" value="女" /><el-option
                  label="保密"
                  value="保密"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="手机号" prop="userPhone">
              <el-input
                v-model="infoForm.userPhone"
                :disabled="!isEditInfo"
                placeholder="请输入手机号"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="userEmail">
              <el-input
                v-model="infoForm.userEmail"
                :disabled="!isEditInfo"
                placeholder="请输入邮箱"
              />
            </el-form-item>
          </div>
          <el-form-item label="个人标签" prop="tags">
            <div class="tags-editor">
              <el-tag
                v-for="(tag, idx) in infoForm.tags"
                :key="idx"
                :closable="isEditInfo"
                :disable-transitions="false"
                size="small"
                round
                @close="removeTag(idx)"
                >{{ tag }}</el-tag
              >
              <template v-if="isEditInfo">
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  size="small"
                  class="tag-input"
                  maxlength="12"
                  @keyup.enter="confirmTag"
                  @blur="confirmTag"
                />
                <el-button v-else size="small" class="tag-add-btn" @click="showTagInput">
                  <art-svg-icon icon="mdi:plus" /> 新增标签
                </el-button>
              </template>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 修改密码 -->
      <div class="uc-card">
        <div class="uc-card__header">
          <div class="uc-card__title">
            <art-svg-icon icon="mdi:lock-reset" class="title-icon" /><span>修改密码</span>
          </div>
          <el-button v-if="!isEditPwd" type="warning" plain size="small" @click="isEditPwd = true">
            <art-svg-icon icon="mdi:key" style="margin-right: 4px" />修改
          </el-button>
          <div v-else class="uc-card__actions">
            <el-button size="small" @click="cancelEditPwd">取消</el-button>
            <el-button type="primary" size="small" :loading="savingPwd" @click="savePwd"
              >保存</el-button
            >
          </div>
        </div>
        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="pwdRules"
          label-position="top"
          class="uc-form"
        >
          <div class="uc-form__grid">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="至少 6 位"
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
                placeholder="再次输入新密码"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, nextTick } from 'vue';
  import { ElMessage } from 'element-plus';
  import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
  import { fetchGetProfile, fetchUpdateProfile, fetchChangePassword } from '@/api/system-manage';
  import { useUserStore } from '@/store/modules/user';

  defineOptions({ name: 'UserCenter' });

  const userStore = useUserStore();

  const profile = reactive<Api.SystemManage.UserProfile>({
    id: 0,
    userName: '',
    nickName: null,
    userPhone: null,
    userEmail: null,
    userGender: null,
    avatar: null,
    remark: null,
    tags: [],
    status: '1',
    createTime: '',
    roles: []
  });

  async function loadProfile() {
    const data = await fetchGetProfile();
    if (data) {
      Object.assign(profile, data);
      // 同步填充表单，使非编辑状态下也能显示数据
      infoForm.nickName = data.nickName || '';
      infoForm.userGender = data.userGender || '';
      infoForm.userPhone = data.userPhone || '';
      infoForm.userEmail = data.userEmail || '';
      infoForm.tags = Array.isArray(data.tags) ? [...data.tags] : [];
    }
  }

  function formatDate(d: string) {
    return d ? new Date(d).toLocaleDateString('zh-CN') : '-';
  }

  function handleAvatarUpload(file: UploadRawFile) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const res = await fetchUpdateProfile({ avatar: base64 });
      if (res) {
        profile.avatar = base64;
        userStore.setUserInfo({ ...userStore.info, avatar: base64 } as any);
        ElMessage.success('头像更新成功');
      }
    };
    reader.readAsDataURL(file);
    return false;
  }

  const isEditInfo = ref(false);
  const savingInfo = ref(false);
  const infoFormRef = ref<FormInstance>();
  const infoForm = reactive({
    nickName: '',
    userGender: '',
    userPhone: '',
    userEmail: '',
    tags: [] as string[]
  });

  // ===== 标签操作 =====
  const tagInputVisible = ref(false);
  const tagInputValue = ref('');
  const tagInputRef = ref<any>();

  function showTagInput() {
    tagInputVisible.value = true;
    nextTick(() => tagInputRef.value?.focus());
  }

  function confirmTag() {
    const val = tagInputValue.value.trim();
    if (val && !infoForm.tags.includes(val) && infoForm.tags.length < 10) {
      infoForm.tags.push(val);
    }
    tagInputVisible.value = false;
    tagInputValue.value = '';
  }

  function removeTag(idx: number) {
    if (isEditInfo.value) infoForm.tags.splice(idx, 1);
  }

  const infoRules: FormRules = {
    userEmail: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
    userPhone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
  };

  function startEditInfo() {
    infoForm.nickName = profile.nickName || '';
    infoForm.userGender = profile.userGender || '';
    infoForm.userPhone = profile.userPhone || '';
    infoForm.userEmail = profile.userEmail || '';
    infoForm.tags = Array.isArray(profile.tags) ? [...profile.tags] : [];
    isEditInfo.value = true;
  }

  function cancelEditInfo() {
    // 从 profile 恢复表单数据，避免 resetFields 清空标签
    infoForm.nickName = profile.nickName || '';
    infoForm.userGender = profile.userGender || '';
    infoForm.userPhone = profile.userPhone || '';
    infoForm.userEmail = profile.userEmail || '';
    infoForm.tags = Array.isArray(profile.tags) ? [...profile.tags] : [];
    isEditInfo.value = false;
    infoFormRef.value?.clearValidate();
  }

  async function saveInfo() {
    await infoFormRef.value?.validate();
    savingInfo.value = true;
    try {
      const res = await fetchUpdateProfile({
        nickName: infoForm.nickName || undefined,
        userGender: infoForm.userGender || undefined,
        userPhone: infoForm.userPhone || undefined,
        userEmail: infoForm.userEmail || undefined,
        tags: infoForm.tags
      });
      if (res) {
        Object.assign(profile, res);
        userStore.setUserInfo({ ...userStore.info, userName: profile.userName } as any);
        ElMessage.success('保存成功');
        isEditInfo.value = false;
      }
    } finally {
      savingInfo.value = false;
    }
  }

  const isEditPwd = ref(false);
  const savingPwd = ref(false);
  const pwdFormRef = ref<FormInstance>();
  const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const pwdRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码至少 6 位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (value !== pwdForm.newPassword) callback(new Error('两次密码不一致'));
          else callback();
        },
        trigger: 'blur'
      }
    ]
  };

  function cancelEditPwd() {
    isEditPwd.value = false;
    pwdFormRef.value?.resetFields();
  }

  async function savePwd() {
    await pwdFormRef.value?.validate();
    savingPwd.value = true;
    try {
      await fetchChangePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      });
      ElMessage.success('密码修改成功');
      isEditPwd.value = false;
      pwdFormRef.value?.resetFields();
    } finally {
      savingPwd.value = false;
    }
  }

  onMounted(() => loadProfile());
</script>

<style scoped lang="scss">
  .uc-wrapper {
    display: flex;
    gap: 20px;
    padding: 20px;
    min-height: 100%;
    box-sizing: border-box;
    background: var(--art-main-bg-color);
    align-items: flex-start;
    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  .uc-aside {
    width: 340px;
    flex-shrink: 0;
    background: var(--default-box-color);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--art-card-border);
    @media (max-width: 900px) {
      width: 100%;
    }
  }

  .uc-cover {
    position: relative;
    height: 110px;
    overflow: hidden;
    &__bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    &__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 40%, var(--default-box-color));
    }
  }

  .uc-profile {
    padding: 0 20px 24px;
    text-align: center;
  }

  .uc-avatar-wrap {
    position: relative;
    display: inline-block;
    margin-top: -40px;
    margin-bottom: 10px;
  }

  .uc-avatar {
    border: 3px solid var(--default-box-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .uc-avatar-upload {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .uc-avatar-edit {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.1);
    }
  }

  .uc-profile__name {
    font-size: 17px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 4px;
  }

  .uc-profile__username {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0 0 10px;
  }

  .uc-profile__roles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }

  .uc-profile__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
    margin-bottom: 14px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    .meta-icon {
      color: var(--el-color-primary);
      font-size: 15px;
      flex-shrink: 0;
    }
  }

  .uc-profile__remark {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    text-align: left;
    display: flex;
    gap: 6px;
    .quote-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  .uc-profile__tags {
    margin-top: 0;
    padding-top: 14px;
    border-top: 1px dashed var(--art-card-border);
    text-align: left;

    .tags-title {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
      .tag-icon {
        font-size: 14px;
        color: var(--el-color-primary);
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .profile-tag {
      border-radius: 20px;
    }
  }

  .tags-editor {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-height: 32px;
    padding: 6px 10px;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-blank);
    cursor: text;

    .tag-input {
      width: 100px;
    }

    .tag-add-btn {
      height: 24px;
      padding: 0 8px;
      font-size: 12px;
      border-style: dashed;
    }
  }

  .uc-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .uc-card {
    background: var(--default-box-color);
    border-radius: 12px;
    border: 1px solid var(--art-card-border);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--art-card-border);
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      .title-icon {
        color: var(--el-color-primary);
        font-size: 18px;
      }
    }

    &__actions {
      display: flex;
      gap: 8px;
    }
  }

  .uc-form {
    padding: 20px;

    &__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 20px;
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
