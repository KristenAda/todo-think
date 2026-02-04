<template>
  <div style="width: 100%">
    <el-form :model="inputForm">
      <el-form-item
        prop="names"
        :rules="[
          {
            required: showCurrentUnit,
            message: '请选择单位',
            trigger: 'change',
          },
        ]"
      >
        <el-input
          v-model="inputForm.names"
          class="select-place"
          placeholder="供电单位"
          clearable
          @clear="emit('clearClick')"
        >
          <template #append
            ><el-button style="color: #409eff" :icon="Fold" @click="showOrg"
          /></template>
        </el-input>
      </el-form-item>
    </el-form>

    <dh-dialog
      v-model="choosePlace"
      class="cDialog"
      title="选择所属单位"
      width="600px"
      style=""
      @open="openDia"
    >
      <div class="cDialog--content">
        <div class="orgFilter-search">
          <el-input
            v-model="filterText"
            class="orgFilter-input"
            style="width: 250px"
            placeholder="输入关键字进行过滤"
            :prefix-icon="Search"
          ></el-input>
          <div v-if="!isRadio" class="orgFilter-contain">
            <el-checkbox
              v-model="containStatus"
              @change="handleCheckboxChange"
            ></el-checkbox>
            包含下级
          </div>
        </div>
        <div
          class="cDialog--content cDialog--content--tree"
          :class="isRadio ? 'radio-select' : ''"
          style="max-height: 500px; overflow: auto"
        >
          <el-tree
            ref="treeRef"
            empty-text="暂无数据"
            :check-strictly="!containStatus || isRadio"
            show-checkbox
            :default-expanded-keys="defaultExpended"
            node-key="mgtOrgName"
            :auto-expand-parent="true"
            :data="orgList"
            :props="treeProps"
            :default-checked-keys="defaultExpended"
            :filter-node-method="filterNode"
            @check="getKeys"
          >
            <template #default="row">
              <span>
                <!-- <el-checkbox v-model="checkboxData[data.mgtOrgCode]"
                            @change="(status: CheckboxValueType) => { selectPart(status, data) }"></el-checkbox> -->
                {{ row.data.mgtOrgName }}</span
              >
            </template>
          </el-tree>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelKeys">取消</el-button>
        <el-button type="primary" @click="confirmKeys">确定</el-button>
      </template>
    </dh-dialog>
  </div>
</template>
<script lang="ts" setup>
import { Fold, Search } from '@element-plus/icons-vue';
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import { ElTree, TreeNode, ElMessage } from 'element-plus';

import { getOrgInfoList2 } from '@/apis/modules/test';
import { useAuthorityStore } from '@/stores/authority';

// @ts-ignore
import powerSupplyUnit from '@/assets/data/powerSupplyUnit.json';

const filterText = ref('');
const treeRef = ref<InstanceType<typeof ElTree>>();
// 包含下级
const containStatus = ref(false);
const useAuthority = useAuthorityStore();
// 当前所属单位
const currentOrg = useAuthority.orgDto;
const inputForm = reactive({
  names: '',
});
let allKeys: Array<string | number | any> = []; // 所有选中的节点
const treeProps = {
  label: 'mgtOrgName',
};
interface Tree {
  [key: string]: any;
}
type Props = {
  modelValue?: any;
  inputMgtOrgName?: any; // 父组件传入的输入框显示的单位名称
  data?: any;
  showCurrentUnit?: boolean; // 是否显示当前登陆人单位
  isRadio?: boolean; // 是否是单选
  isChild?: boolean; // 是否为传入父节点，显示子节点
  parentCodes?: ''; // 父节点单位码
  isGds?: boolean; // 是否为直选供电所模式
};
// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  inputMgtOrgName: '', // 父组件传入的输入框显示的单位名称
  data: [],
  showCurrentUnit: true, // 是否显示当前登陆人单位
  isRadio: false, // 是否是单选
  isChild: false,
  parentCodes: '',
  isGds: false,
});

const names = ref();
const choosePlace = ref(false);

// 当前人员所处单位
const listKey = currentOrg.mgtOrgCode || 51101;

// 单位列表
const orgList = ref([]);

// // 默认打开第一级
const expandName = () => {
  return orgList.value.map((item: any) => {
    return item.mgtOrgName;
  });
};

const defaultExpended: any = ref([...expandName()]);
// 开始查询
let startStatus = false;

const flattenArray = (arr: any): any => {
  let result: any = [];
  for (const item of arr) {
    // 如果元素是数组，递归处理后合并，否则直接添加
    if (Array.isArray(item)) {
      result = result.concat(flattenArray(item));
    } else {
      result.push(item);
    }
  }
  return result;
};

// 过滤掉当前登陆人的单位的父节点单位和兄弟单位，
const findOrgByCode = (orgs: any): any => {
  const parentCodesArr = Array.isArray(props.parentCodes)
    ? props.parentCodes
    : String(props.parentCodes).split(',').filter(Boolean);
  if (props.isChild) {
    let results: any[] = [];
    for (const org of orgs) {
      if (parentCodesArr.includes(org.mgtOrgCode)) {
        results.push(org);
        // eslint-disable-next-line no-continue
        continue;
      }
      if (org.children && org.children.length > 0) {
        const foundInChildren = findOrgByCode(org.children);
        if (Array.isArray(foundInChildren) && foundInChildren.length > 0) {
          results = results.concat(foundInChildren);
        }
      }
    }
    return flattenArray(results);
  }
  for (const org of orgs) {
    if (org.mgtOrgCode === currentOrg.mgtOrgCode) {
      return flattenArray([org]);
    }
    if (org.children && org.children.length > 0) {
      const foundInChildren = findOrgByCode(org.children);
      if (Array.isArray(foundInChildren) && foundInChildren.length > 0) {
        return flattenArray(foundInChildren);
      }
    }
  }
  return orgs;
};

// 重置状态
const refreshStatus = () => {
  allKeys = [];
  if (props.showCurrentUnit) {
    orgList.value.forEach((item: any) => {
      if (item.mgtOrgName === currentOrg.mgtOrgName) {
        allKeys.push(item.mgtOrgName);
      }
    });
  }
  startStatus = true;
  refreshInputName(allKeys);
  emit('update:modelValue', allKeys?.join(','));

  console.log(orgList.value);
};
// 过滤节点
const filterOrgList = (orgs: any) => {
  // console.log(1111)
  return orgs.filter((org: any) => {
    // 如果当前组织名称bu包含 "国网四川"，则忽略该组织及其所有子组织
    if (!org.mgtOrgName.includes('国网四川') || org.mgtOrgType !== 'corp') {
      if (
        org.mgtOrgName.includes('囯网四川') ||
        org.mgtOrgName === '四川统调电厂'
      ) {
        return true;
      }
      return false;
    }
    if (org.mgtOrgCode.length > 9) {
      return false;
    }
    // 如果当前组织没有被删除，则检查其子组织是否包含 "国网四川"
    if (org.children) {
      org.children = filterOrgList(org.children); // 递归过滤子组织
    }

    return true;
  });
};
// 只有供电所可选
const addDisabledToTreeByCondition = (tree) => {
  // 处理单个节点对象
  if (typeof tree === 'object' && !Array.isArray(tree) && tree !== null) {
    const newNode = { ...tree };

    // 自定义条件：根据 mgtOrgCode 长度赋值 disabled
    const mgtOrgCode = String(newNode.mgtOrgCode || '');
    newNode.disabled = mgtOrgCode.length !== 9; // 长度为 9 → false，否则 → true

    // 递归处理子节点
    if (Array.isArray(tree.children) && tree.children.length > 0) {
      newNode.children = tree.children.map((child) =>
        addDisabledToTreeByCondition(child),
      );
    } else {
      newNode.children = [];
    }

    return newNode;
  }

  // 处理根节点数组
  if (Array.isArray(tree)) {
    return tree.map((node) => addDisabledToTreeByCondition(node));
  }

  return tree;
};
const isEnableLocalUnitData = ref(
  import.meta.env.VITE_APP_ENABLE_LOCAL_UNIT_DATA === 'true',
);
// 获取树形节点数据
const getOrgList = async () => {
  const data = {
    // 51402,51101,5140202,514020203
    mgtOrgCode: listKey,
  };

  // 本地开发环境才初始化本地数据
  if (isEnableLocalUnitData.value) {
    orgList.value = powerSupplyUnit; // 测试静态数据
    if (props.isGds) {
      orgList.value = addDisabledToTreeByCondition(orgList.value);
    }
    console.log('orgList.value :>> ', orgList.value);
    return; // TODO 注意去掉
  }

  // eslint-disable-next-line no-unreachable
  const res = await getOrgInfoList2(data).catch((err: any) => {
    console.log('err :>> ', err);
  });

  // eslint-disable-next-line no-unreachable
  if (res?.code === 200) {
    console.log(res);
    // orgList.value = filterOrgList(res.data) || [];
    orgList.value = filterOrgList(findOrgByCode(res.data)) || [];
    if (props.isGds) {
      orgList.value = addDisabledToTreeByCondition(orgList.value);
    }
    defaultExpended.value = [...expandName()];
    if (!startStatus) {
      refreshStatus();
      startStatus = true;
    }
  }
};
// 显示弹框
const showOrg = () => {
  getOrgList();
  // orgList.value = filterOrgList(findOrgByCode(orgList.value));

  choosePlace.value = true;
};
watch(
  () => choosePlace.value,
  () => {
    if (choosePlace.value) {
      nextTick(() => {
        treeRef.value?.setCheckedKeys(allKeys);
      });
    } else {
      choosePlace.value = false;
    }
  },
);
const openDia = () => {
  filterText.value = '';
  containStatus.value = false;
};

onMounted(() => {
  // orgList.value = yy
  if (props.inputMgtOrgName) {
    inputForm.names = props.inputMgtOrgName;
  } else {
    inputForm.names = props.showCurrentUnit ? currentOrg.mgtOrgName : '';
  }
  // inputForm.names =props.modelValue || props.showCurrentUnit ? currentOrg.mgtOrgName : ''; // 根据父组件传入的值设置input显示
  // getOrgList();
  // orgList.value=filterOrgList(orgList.value)
});
// 取消按钮
const cancelKeys = () => {
  // allKeys = props.modelValue.split(',');
  choosePlace.value = false;
};
// 包含下级勾选，多选
const handleCheckboxChange = (val: any) => {
  const keys: Array<TreeNode> | undefined = treeRef.value?.getCheckedNodes();
  const keyList: any = [];
  // const keyListCh:any=[]
  keys?.forEach((item: any) => {
    keyList.push(item);
  });
  // emit('isInclude',containStatus.value)
  if (val) {
    // 如果勾选了 "包含下级"，递归选中所有节点及其子节点
    selectAllChildren(keyList);
  } else {
    console.log(keys);
    // const delNode=keyList.slice(1)
    // 如果取消勾选，递归取消选中所有节点及其子节点
    deselectAllChildren(keyList);
    // treeRef.value?.setCheckedNodes(keys)
    // console.log(keyList)
  }
};
// 选择包含下级，选中下级
const selectAllChildren = (nodes: any) => {
  nodes.forEach((node: any) => {
    nextTick(() => {
      // 选中当前节点
      treeRef.value?.setChecked(node, true, true);
      // 当节点超过1000 不允许选择
      // 如果有子节点，递归选中
      if (node.children && node.children.length > 0) {
        selectAllChildren(node.children);
      }
    });
  });
};
// 不选择包含下级，删除所有下级
const deselectAllChildren = (nodes: any) => {
  nodes.forEach((node: any) => {
    nextTick(() => {
      // 仅取消当前节点的子节点勾选状态
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => {
          treeRef.value?.setChecked(child, false, false);
        });
        // 递归取消子节点的选中状态
        deselectAllChildren(node.children);
      }
    });
  });
};

// 点击勾选,单选逻辑
const getKeys = (data: any, status: any) => {
  if (props.isRadio) {
    console.log('data', data, 'status', status);
    let checked = true;

    console.log(allKeys);
    if (allKeys.includes(data.mgtOrgName)) {
      // 当前点击项已选中，变成不选中
      checked = false;
    } else {
      checked = true;
    }
    treeRef.value?.setCheckedKeys([]);
    treeRef.value?.setChecked(data, checked, false);

    allKeys = treeRef.value?.getCheckedKeys() || [];
  }
};
const emit = defineEmits([
  'start',
  'update:modelValue',
  'getCode',
  'isInclude',
  'getNode',
  'clearClick',
]);

// 点击重置
const reset = () => {
  console.log('reset :>> ', 1);
  if (props.showCurrentUnit) {
    inputForm.names = currentOrg.mgtOrgName;
  } else {
    inputForm.names = '';
  }
};
// 暴露内容
defineExpose({
  refreshStatus,
  reset,
});
// input文字
let inputNames: Array<string> = [];
const getAllInputName = (orgArr: any, key: number | string) => {
  orgArr.forEach((org: any) => {
    if (org.mgtOrgName === key) {
      inputNames.push(org.mgtOrgName);
    } else if (org.children && org.children.length > 0) {
      getAllInputName(org.children, key);
    }
  });
};
// input文字更新
const refreshInputName = (allKeyList?: Array<string | number>) => {
  inputNames = [];
  let keys: Array<any> = treeRef.value?.getCheckedKeys() || [];
  keys = choosePlace.value ? keys : allKeyList || [];
  inputForm.names = '';
  keys.forEach((key: string | number) => {
    getAllInputName(orgList.value, key);
  });
  // inputNames.push(currentOrg?.mgtOrgName ?? '')
  if (!inputNames.length) {
    inputForm.names = currentOrg?.mgtOrgName;
  } else {
    inputForm.names = inputNames.join(',');
  }
};

// 搜索过滤
const filterNode = (value: string, data: Tree) => {
  // 当value为空字符串时，函数返回true，意味着不进行任何过滤
  if (!value) return true;
  // 检查data的mgtOrgName属性是否包含value，如果包含则返回true，表示过滤条件满足
  return data.mgtOrgName.includes(value);
};
// 输入关键字搜索树
watch(filterText, (val: string) => {
  treeRef.value!.filter(val);
});

// 点击确定

const confirmKeys = () => {
  emit('isInclude', containStatus.value);
  const ids: Array<any> | undefined = treeRef.value?.getCheckedKeys();
  const keys: Array<TreeNode> | undefined = treeRef.value?.getCheckedNodes();

  const mgtIds: any = [];

  keys?.forEach((item: any) => {
    mgtIds.push(item.mgtOrgCode);
  });
  if (mgtIds.length >= 1000) {
    ElMessage.error(`供电单位选择超过1000个`);
    return;
  }
  emit('getNode', keys);
  if (props.isRadio) {
    // 单选返回字符串
    emit('getCode', mgtIds?.join(','));
    emit('update:modelValue', mgtIds?.join(',')); // 同步将父组件的表单组件的值更新
  } else {
    // 多选返回数组
    emit('getCode', mgtIds);
    emit('update:modelValue', mgtIds); // 同步将父组件的表单组件的值更新
  }
  // emit('update:modelValue', ids?.join(','));
  const showMgtList: any = [];
  keys?.forEach((item: any) => {
    showMgtList.push(item.mgtOrgName);
  });
  console.log(showMgtList);
  inputForm.names = showMgtList.join(',');
  // refreshInputName();
  choosePlace.value = false;
};
</script>
<style lang="scss" scoped>
.cDialog--content--tree {
  overflow: auto;
}

.radio-select {
  :deep(.el-checkbox__inner) {
    border-radius: 50% !important;
  }
}

.cDialog {
  --el-dialog-padding-primary: 0;

  .cDialog--buttons {
    padding: 20px 0;
    border-top: 1px solid #c6e2ff;
    display: flex;
    align-items: center;
    // justify-content: center;
  }

  .orgFilter-input {
    width: 100%;
  }

  .orgFilter-search {
    display: flex;
    align-items: center;
    padding: 15px 15px 0px 15px;
  }

  .orgFilter-contain {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 30px;

    label {
      margin-right: 5px;
    }
  }
}

// .cDialog--buttons{
//     width:100%;
//     text-align: right !important;
// }
</style>
