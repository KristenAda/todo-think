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
          <UserAvatar
            :size="72"
            :src="profile.avatar"
            :name="profile.nickName || profile.userName || '用户'"
            :gender="profile.userGender ?? ''"
            avatar-class="uc-avatar"
          />
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
              >加入于 {{ formatDateTime(profile.createTime) }}</span
            >
          </div>
        </div>
        <!-- <div class="uc-profile__remark" v-if="profile.remark">
          <art-svg-icon icon="mdi:format-quote-open" class="quote-icon" />{{ profile.remark }}
        </div> -->
        <div class="uc-profile__tags">
          <div class="tags-title-row">
            <div class="tags-title"
              ><art-svg-icon icon="mdi:tag-multiple" class="tag-icon" />个人标签</div
            >
            <button
              type="button"
              class="uc-tags-add-trigger"
              :disabled="
                savingAsideTags || (!asideTagEditing && profile.tags.length >= 10)
              "
              @click="onAsideTagAddTrigger"
            >
              <art-svg-icon :icon="asideTagEditing ? 'mdi:chevron-up' : 'mdi:plus'" />
              <span>{{ asideTagEditing ? '收起' : '添加' }}</span>
            </button>
          </div>
          <div class="tags-list">
            <el-tag
              v-for="tag in profile.tags"
              :key="tag"
              size="small"
              effect="plain"
              round
              closable
              class="profile-tag"
              :disable-transitions="true"
              @close="removeAsideTag(tag)"
              >{{ tag }}</el-tag
            >
          </div>
          <div v-show="asideTagEditing" class="tags-editor" @click.stop>
            <el-input
              ref="asideTagInputRef"
              v-model="asideTagInput"
              size="small"
              class="tag-input"
              :disabled="savingAsideTags || profile.tags.length >= 10"
              placeholder="标签名"
              maxlength="12"
              @keyup.enter.prevent="commitAsideTagInput"
            />
            <el-button
              class="tag-add-btn"
              size="small"
              type="primary"
              plain
              :disabled="savingAsideTags || profile.tags.length >= 10"
              @click.stop="commitAsideTagInput"
            >
              添加
            </el-button>
            <el-button
              class="tag-cancel-btn"
              link
              type="primary"
              size="small"
              :disabled="savingAsideTags"
              @click.stop="closeAsideTagEditor"
            >
              取消
            </el-button>
          </div>
        </div>

        <div class="uc-profile__tail">
          <div class="uc-stat-chip">
            <div class="uc-stat-chip__icon-wrap">
              <art-svg-icon icon="ri:coin-fill" class="uc-stat-chip__icon" />
            </div>
            <div class="uc-stat-chip__text">
              <span class="uc-stat-chip__label">累计积分</span>
              <span class="uc-stat-chip__value">{{ displayPoints }}</span>
            </div>
          </div>
          <router-link class="uc-quick-entry" to="/business/points-ledger/mine">
            <art-svg-icon icon="mdi:clipboard-text-clock-outline" class="uc-quick-entry__icon" />
            <span>积分流水</span>
            <art-svg-icon icon="mdi:chevron-right" class="uc-quick-entry__arrow" />
          </router-link>
        </div>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <main class="uc-main">
      <div class="uc-primary-row">
      <!-- 基本信息 -->
      <div class="uc-card uc-card--basic">
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
          <div class="uc-form__grid uc-form__grid--stack">
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
        </el-form>
      </div>

      <div class="uc-radar-wrap">
        <UserPerfRadarPanel />
      </div>
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
  import { fetchMyTotalPoints } from '@/api/task';
  import { useUserStore } from '@/store/modules/user';
  import { formatDateTime } from '@/utils/date';
  import UserPerfRadarPanel from '@/components/business/user-performance/UserPerfRadarPanel.vue';

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

  /** 与顶栏一致的累计积分展示 */
  const displayPoints = ref(0);

  async function loadProfile() {
    const data = await fetchGetProfile();
    if (data) {
      Object.assign(profile, data);
      if (!Array.isArray(profile.tags)) profile.tags = [];
      // 同步填充表单，使非编辑状态下也能显示数据
      infoForm.nickName = data.nickName || '';
      infoForm.userGender = data.userGender || '';
      infoForm.userPhone = data.userPhone || '';
      infoForm.userEmail = data.userEmail || '';
    }
  }

  async function loadMyPoints() {
    try {
      const res = await fetchMyTotalPoints();
      displayPoints.value = Number(res?.totalPoints ?? 0);
    } catch {
      displayPoints.value = 0;
    }
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
    userEmail: ''
  });

  const savingAsideTags = ref(false);
  const asideTagEditing = ref(false);
  const asideTagInput = ref('');
  const asideTagInputRef = ref<{ focus?: () => void } | null>(null);

  function closeAsideTagEditor() {
    asideTagEditing.value = false;
    asideTagInput.value = '';
  }

  function onAsideTagAddTrigger() {
    if (asideTagEditing.value) {
      closeAsideTagEditor();
      return;
    }
    if (profile.tags.length >= 10) {
      ElMessage.warning('最多添加 10 个标签');
      return;
    }
    asideTagEditing.value = true;
    nextTick(() => asideTagInputRef.value?.focus?.());
  }

  async function persistProfileTags() {
    savingAsideTags.value = true;
    try {
      const res = await fetchUpdateProfile({ tags: [...profile.tags] });
      if (res) Object.assign(profile, res);
    } finally {
      savingAsideTags.value = false;
    }
  }

  async function commitAsideTagInput() {
    if (savingAsideTags.value) return;
    const val = asideTagInput.value.trim();
    if (!val) {
      ElMessage.warning('标签名称不能为空');
      return;
    }
    if (val.length > 12) {
      ElMessage.warning('标签不超过 12 个字');
      return;
    }
    if (profile.tags.length >= 10) {
      ElMessage.warning('最多添加 10 个标签');
      return;
    }
    if (profile.tags.includes(val)) {
      ElMessage.warning('已有同名标签');
      return;
    }
    profile.tags.push(val);
    asideTagInput.value = '';
    await persistProfileTags();
    closeAsideTagEditor();
  }

  async function removeAsideTag(tag: string) {
    profile.tags = profile.tags.filter((t) => t !== tag);
    await persistProfileTags();
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
    isEditInfo.value = true;
  }

  function cancelEditInfo() {
    infoForm.nickName = profile.nickName || '';
    infoForm.userGender = profile.userGender || '';
    infoForm.userPhone = profile.userPhone || '';
    infoForm.userEmail = profile.userEmail || '';
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
        tags: [...profile.tags]
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

  onMounted(() => {
    void loadProfile();
    void loadMyPoints();
  });
</script>

<style scoped lang="scss">
  /* 个人中心：大块间距与卡片内边距统一使用同一刻度（略紧凑，减少整页滚动） */
  $uc-gap: 12px;

  .uc-wrapper {
    display: flex;
    gap: $uc-gap;
    padding: $uc-gap;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    background: var(--art-main-bg-color);
    align-items: stretch;
    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  .uc-aside {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    align-self: stretch;
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
    height: 72px;
    overflow: hidden;
    flex-shrink: 0;
    &__bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    &__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 28%, var(--default-box-color));
    }
  }

  .uc-profile {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 16px 14px;
    text-align: center;
    display: flex;
    flex-direction: column;
  }

  .uc-avatar-wrap {
    position: relative;
    display: inline-block;
    /* 与封面脱开，避免被背景图裁切遮挡（封面与资料区分属两块区域） */
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .uc-avatar {
    border: 3px solid var(--default-box-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  :deep(.uc-avatar.color-avatar) {
    border: 3px solid var(--default-box-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
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
    margin: 0 0 8px;
  }

  .uc-profile__roles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  .uc-profile__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    margin-bottom: 10px;
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

  .uc-profile__tail {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px dashed var(--art-card-border);
    text-align: left;
    flex-shrink: 0;
  }

  .uc-stat-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0 10px;
    margin-bottom: 4px;
    border-radius: 0;
    background: transparent;
    border: none;
  }

  .uc-stat-chip__icon-wrap {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    /* 与侧栏底色融合，仅用浅琥珀点缀，避免整块灰底 */
    background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--el-color-warning) 22%, transparent);
  }

  .uc-stat-chip__icon {
    font-size: 19px;
    color: var(--el-color-warning);
  }

  .uc-stat-chip__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .uc-stat-chip__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.2;
  }

  .uc-stat-chip__value {
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-primary);
    line-height: 1;
  }

  .uc-quick-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    text-decoration: none;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--default-box-color);
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }
  }

  .uc-quick-entry__icon {
    font-size: 18px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .uc-quick-entry span {
    flex: 1;
    min-width: 0;
  }

  .uc-quick-entry__arrow {
    font-size: 18px;
    opacity: 0.45;
    flex-shrink: 0;
  }

  .uc-profile__tags {
    margin-top: 0;
    padding-top: 10px;
    border-top: 1px dashed var(--art-card-border);
    text-align: left;

    .tags-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    .tags-title {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 0;
      flex: 1;
      min-width: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      .tag-icon {
        font-size: 14px;
        color: var(--el-color-primary);
      }
    }

    .uc-tags-add-trigger {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
      padding: 0;
      margin: 0;
      border: none;
      background: none;
      font-size: 12px;
      color: var(--el-color-primary);
      cursor: pointer;
      line-height: 1.3;

      .art-svg-icon {
        font-size: 14px;
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        text-decoration: underline;
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* 仅展开时出现：与原先基本信息 tags-editor 一致 */
    .tags-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
      min-height: 32px;
      padding: 6px 10px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-fill-color-blank);

      .tag-input {
        flex: 1;
        min-width: 0;
      }

      .tag-add-btn {
        height: 24px;
        padding: 0 8px;
        font-size: 12px;
        border-style: dashed;
      }

      .tag-cancel-btn {
        padding: 0 4px;
        font-size: 12px;
      }
    }

    .profile-tag {
      border-radius: 20px;
    }
  }

  .uc-main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $uc-gap;
  }

  .uc-primary-row {
    display: flex;
    align-items: stretch;
    gap: $uc-gap;
    flex-wrap: nowrap;
    min-height: 0;

    @media (max-width: 900px) {
      flex-wrap: wrap;
    }
  }

  /* 基本信息 : 人员画像 ≈ 2 : 3（基本信息单列较窄，画像略宽） */
  .uc-card--basic {
    flex: 2 1 0;
    min-width: 0;
    align-self: stretch;
    display: flex;
    flex-direction: column;

    @media (max-width: 900px) {
      flex: 1 1 100%;
    }
  }

  .uc-card--basic .uc-card__header {
    flex-shrink: 0;
  }

  .uc-card--basic .uc-form {
    flex: 1;
    min-height: 0;
  }

  .uc-radar-wrap {
    flex: 3 1 0;
    min-width: 0;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    min-height: 0;

    @media (max-width: 900px) {
      flex: 1 1 100%;
      min-height: 300px;
    }
  }

  .uc-radar-wrap :deep(.uprp) {
    flex: 1;
    min-height: 0;
    height: auto;
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
      padding: 12px 16px;
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
    padding: 14px 16px;

    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }

    &__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 20px;
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }

      &--stack {
        grid-template-columns: 1fr;
        gap: 10px 0;
      }
    }
  }
</style>
