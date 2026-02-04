<template>
  <el-upload
    ref="uploadRef"
    v-model:file-list="fileList"
    class="upload-demo"
    multiple
    :on-preview="(file) => emit('onPreview', file)"
    :on-remove="(file, files) => emit('onRemove', file, files)"
    :before-remove="beforeRemove"
    :on-success="handleSuccess"
    :on-error="handleError"
    :limit="limit"
    :accept="props.accept"
    :on-exceed="handleExceed"
    v-bind="{ ...$attrs }"
    :auto-upload="props.autoUpload"
    :on-change="handleFileChange"
  >
    <el-button type="primary">上传文件</el-button>
    <template v-if="showTip" #tip>
      <slot v-if="hasTipSlot" name="tip"></slot>
      <div v-else class="el-upload__tip">
        请上传excel文件,最多上传{{ limit }}个文件
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import type {
  UploadProps,
  UploadUserFile,
  UploadFile,
  UploadFiles,
} from 'element-plus';

interface Prop {
  action: string; // 文件上传路径
  accept?: string; // 上传文件扩展名限制
  limit?: number; // 文件上传数量限制
  showTip?: boolean; // 是否显示默认的tip内容
  autoUpload?: boolean; // 是否自动上传 默认否
}
const emit = defineEmits<{
  onPreview: [file: UploadUserFile]; // 预览文件事件
  onRemove: [file: UploadUserFile, files: UploadUserFile[]]; // 移除文件事件
  beforeRemove: [uploadFile: UploadUserFile, uploadFiles: UploadUserFile[]]; // 移除文件前事件
  onSuccess: [response: any, uploadFile: UploadFile, uploadFiles: UploadFiles]; // 上传成功
  onError: [response: any, uploadFile: UploadFile, uploadFiles: UploadFiles]; // 上传失败
}>();
const uploadRef = ref();
const props = withDefaults(defineProps<Prop>(), {
  action: '',
  accept: '',
  limit: 1,
  showTip: true,
  autoUpload: false,
});
const slots = useSlots();
const hasTipSlot = computed(() => !!slots.tip && slots.tip().length > 0);
const fileList = ref<UploadUserFile[]>([
  //   {
  //     name: 'element-plus-logo.svg',
  //     url: 'https://element-plus.org/images/element-plus-logo.svg',
  //   },
  //   {
  //     name: 'element-plus-logo2.svg',
  //     url: 'https://element-plus.org/images/element-plus-logo.svg',
  //   },
]);

// 文件上传成功
const handleSuccess = (
  response: any,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) => {
  emit('onSuccess', response, uploadFile, uploadFiles);
};

//   文件上传失败
const handleError = (
  error: Error,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles,
) => {
  emit('onError', error, uploadFile, uploadFiles);
};

const acceptList = computed(() => {
  if (!props.accept) return [];
  return props.accept
    .split(',')
    .map((ext) => ext.trim())
    .filter((ext) => ext);
});

// 文件列表发生变化
const handleFileChange: UploadProps['onChange'] = (file) => {
  validateSqlFile(file);
};

// 文件类型校验
const validateSqlFile = (file: UploadFile): boolean => {
  if (!file) return false;
  const fileName = file.name || '';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  if (
    acceptList.value.length > 0 &&
    !acceptList.value.includes('.' + fileExt)
  ) {
    ElMessage.error(
      `文件类型错误！仅支持 ${props.accept} 格式文件，当前文件：${fileName}`,
    );
    // 仅移除当前错误文件
    fileList.value = fileList.value.filter((item) => item.uid !== file.uid);
    return false;
  }

  return true;
};
// 选择文件超出limit
const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `限制数量为${props.limit}个，本次你选择了${files.length}个文件，累计总数达到${
      files.length + uploadFiles.length
    }个`,
  );
};

// 移除文件
const beforeRemove: UploadProps['beforeRemove'] = async (
  uploadFile,
  uploadFiles,
) => {
  try {
    await ElMessageBox.confirm(`取消上传 ${uploadFile.name} ?`);
    emit('beforeRemove', uploadFile, uploadFiles);
    return true;
  } catch {
    return false;
  }
};

watch(
  () => props.action,
  (action) => {
    if (!action && props.autoUpload) {
      ElMessage.error('文件上传失败：未配置上传接口地址（action）');
    }
  },
  { immediate: true },
);

defineExpose({
  uploadRef,
});
</script>
