<template>
  <div style="width: 100%">
    <el-input
      v-model="names"
      class="select-place"
      placeholder="选择人员"
      clearable
      @clear="emit('clearClick')"
    >
      <template #append
        ><el-button style="color: #409eff" icon="Fold" @click="showUser"
      /></template>
    </el-input>

    <dh-dialog
      v-model="chooseUser"
      class="cDialog"
      title="选择人员"
      width="80%"
      style="overflow: auto"
      @close="closeDialog"
    >
      <div class="cDialog--content">
        <div class="common-title">
          <c-title name="查询条件"></c-title>
        </div>
        <el-form
          ref="searchRef"
          :inline="true"
          :model="searchForm"
          class="search-form"
        >
          <el-row>
            <el-col :span="8">
              <el-form-item label="账号" prop="loginName">
                <el-input
                  v-model="searchForm.loginName"
                  placeholder="请输入账号"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="姓名" prop="userName">
                <el-input v-model="searchForm.userName" placeholder="请输入">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单位部门" prop="mgtOrgCode">
                <!-- <chooseUnit
                ref="unit"
               
                @start="startSearch"
                @get-code="getCode"
                @isInclude="cludeChange"
            ></chooseUnit> -->
                <chooseUnit
                  ref="unit"
                  @start="startSearch"
                  @get-code="getCode"
                ></chooseUnit>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否包含下级" prop="isClude">
                <el-select v-model="isClude" placeholder="请选择" clearable>
                  <el-option
                    v-for="item in cludeList || []"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col class="search-buttons__col">
              <el-form-item>
                <div class="search-buttons">
                  <el-button @click="onReset">重置</el-button>
                  <el-button type="primary" @click="onSubmit">查询</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <el-divider></el-divider>
        <div>人员信息</div>

        <c-table-old
          :headers="tableHeaders"
          :loading="loading"
          :table-options="{ data: tableData }"
          :hide-excel="false"
          :page-data="pageData"
          :is-select="!isRadio"
          :is-radio="isRadio"
          :show-radio="isRadio"
          :is-show-user="chooseUser"
          @page-change="handlePage"
          @select="selectChange"
        >
        </c-table-old>
      </div>
      <template #footer>
        <el-button @click="cancelKeys">取消</el-button>
        <el-button type="primary" @click="confirmKeys">确定</el-button>
      </template>
    </dh-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  getsubUserByCondition,
  getsubUserByCurrentOrgs,
  getUserByOrgs,
} from '@/apis/modules/test';
import { getSingleOrg } from '@/utils';
import chooseUnit from './ChooseUnit.vue';
// import { userTableHeaders } from './tableHeaders';

onMounted(() => {
  getUserList();
});
type Props = {
  formProp?: boolean;
  modelValue?: string;
  userNames?: string;
  data?: any;
  isRadio?: boolean;
};
// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<Props>(), {
  modelValue: '', // 选择的人员id字符串
  userNames: '',
  formProp: true,
  data: [],
  isRadio: false,
});
const isEnableLocalUnitData = ref(
  import.meta.env.VITE_APP_ENABLE_LOCAL_UNIT_DATA === 'true',
);
const closeDialog = () => {
  pageData.pageNum = 1;
  pageData.pageSize = 10;
};
// 编辑初始化选中的人员
watch(
  () => props.userNames,
  () => {
    nextTick(() => {
      names.value = props.userNames;
    });
  },
  { immediate: true, deep: true },
);
const currentOrg = getSingleOrg();
const isClude = ref('1');
const searchForm: any = reactive({
  loginName: undefined,
  userName: undefined,
  mgtOrgCode: currentOrg.mgtOrgCode || '51101',
});
const searchForm2: any = reactive({
  loginName: undefined,
  userName: undefined,
  mgtOrgCodes: currentOrg.mgtOrgCode,
});
// 选中的人员名字
const names = ref('');
// 控制弹窗
const chooseUser = ref(false);
const searchRef: any = ref(null);
const showUser = () => {
  searchRef.value?.clearValidate();
  chooseUser.value = true;
  // userInfos.value=[]
};
const cludeList = ref([
  { name: '是', value: '1' },
  { name: '否', value: '0' },
]);

const tableHeaders = [
  {
    prop: 'loginName',
    label: '账号',
    'show-overflow-tooltip': true,
    // width: 120
  },
  {
    prop: 'userName',
    label: '姓名',
  },
  {
    prop: 'orgName',
    label: '供电单位',
    'show-overflow-tooltip': true,
    // width: 120
  },
  {
    prop: 'deptName',
    label: '部门',
    'show-overflow-tooltip': true,
  },
];
const loading = ref(false);
const tableData = ref([]);
// 获取单位码
const getCode = (val: any) => {
  searchForm.mgtOrgCode = val;
  // getUserList()
};
const getUserList = () => {
  // 本地开发环境才初始化本地数据
  if (isEnableLocalUnitData.value) {
    tableData.value = [
      {
        systemUserId: '1',
        loginName: 'admin',
        userName: '管理员',
        orgName: '国网四川省xxxxxxxxxx',
        deptName: '部门',
        isClude: '是',
      },
      {
        userId: '12',
        loginName: 'admin',
        userName: '管理员2',
        orgName: '国网四川省xxxxxxxxxx',
        deptName: '部门',
        isClude: '是',
      },
    ];
    return;
  }
  if (isClude.value === '1') {
    if (searchForm.mgtOrgCode.split(',').length > 1) {
      getuserByorgs();
    } else {
      getUserList1();
    }
  } else {
    getUserList0();
  }
};
// 不包含下级
const getUserList0 = async () => {
  loading.value = true;
  searchForm2.loginName = searchForm.loginName;
  searchForm2.userName = searchForm.userName;
  searchForm2.mgtOrgCodes = searchForm.mgtOrgCode;
  const data = {
    ...searchForm2,
    pageNo: pageData.pageNum,
    pageSize: pageData.pageSize,
  };
  const res = await getsubUserByCurrentOrgs(data);
  loading.value = false;
  tableData.value = res.data;
  pageData.total = res.total;
};
// 包含夏季
const getUserList1 = async () => {
  loading.value = true;
  const data = {
    ...searchForm,
    pageNo: pageData.pageNum,
    pageSize: pageData.pageSize,
  };
  console.log(data);
  const res = await getsubUserByCondition(data);
  loading.value = false;
  console.log(res);
  tableData.value = res.data;
  pageData.total = res.total;
};
const getuserByorgs = async () => {
  searchForm2.loginName = searchForm.loginName;
  searchForm2.userName = searchForm.userName;
  searchForm2.mgtOrgCodes = searchForm.mgtOrgCode;

  loading.value = true;
  const data = {
    ...searchForm2,
    pageNo: pageData.pageNum,
    pageSize: pageData.pageSize,
  };
  const res = await getUserByOrgs(data);
  loading.value = false;
  tableData.value = res.data;
  pageData.total = res.total;
};

// 分页数据
const pageData = reactive({ pageSize: 10, pageNum: 1, total: 0 });

interface pageProp {
  pageSize: number;
  pageNum: number;
}
// 分页器数据变化
const handlePage = (val: pageProp) => {
  if ('pageNum' in val) pageData.pageNum = val.pageNum;
  if ('pageSize' in val) pageData.pageSize = val.pageSize;
  getUserList();
};
// 查询获取表格数据
const startSearch = () => {
  getUserList();
};
const unit: any = ref(null);
// 重置获取表格数据
const onReset = () => {
  unit.value?.refreshStatus();
  searchForm.mgtOrgCode = currentOrg.mgtOrgCode;
  searchForm.loginName = undefined;
  searchForm.userName = undefined;
  isClude.value = '1';
  pageData.pageNum = 1;
  pageData.pageSize = 10;
  getUserList();
};
const onSubmit = () => {
  pageData.pageNum = 1;
  pageData.pageSize = 10;
  getUserList();
};
// 获取选中表格数据
const userInfos = ref<any[]>([]);
const selectChange = (val: any) => {
  userInfos.value = [];
  if (props.isRadio) {
    const user = {
      userId: val.systemUserId,
      userName: val.userName,
      userOrgCode: val.orgNo,
    };
    userInfos.value.push(user);
  } else {
    val.forEach((item: any) => {
      const user = {
        userId: item.systemUserId,
        userName: item.userName,
        userOrgCode: item.orgNo,
      };
      userInfos.value.push(user);
    });
  }
};
// 取消按钮
const cancelKeys = () => {
  //   console.log(props.modelValue)
  //   allKeys=props.modelValue.split(',')//获取当前已选审批人员显示框的id
  chooseUser.value = false;
};
const emit = defineEmits([
  'update:modelValue',
  'getInfo',
  'getOrgCode',
  'clearClick',
]);
// 确定按钮
const confirmKeys = () => {
  chooseUser.value = false;
  names.value = userInfos.value.map((item: any) => item.userName).join(',');
  const ids = userInfos.value.map((item: any) => item.userId);
  // const orgCode=userInfos.value.map((item:any)=>item.orgNo)
  emit('update:modelValue', ids?.join(',')); // 同步将父组件的表单组件的值更新 选中人员的id
  emit('getInfo', userInfos.value);
};
const clearName = () => {
  console.log('1 :>> ', 1);
  names.value = '';
};
defineExpose({
  clearName,
  reset: clearName,
});
</script>

<style lang="scss" scoped>
.el-col {
  height: 40px;
}

.search-form {
  --el-border-color: #c6e2ff !important;

  :deep(.el-select__caret) {
    color: #c6e2ff;
  }
}

:deep(
  .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active
):before {
  content: '';
  display: block;
  width: 80%;
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: #2f90fd;
}

:deep(.el-tabs--border-card > .el-tabs__header) {
  border-bottom: 0 !important;
}

:deep(.el-form-item) {
  width: 100%;
  --el-border-color: #c6e2ff;
}

.search-form {
  --el-border-color: #c6e2ff;

  :deep(.el-select__caret) {
    color: #c6e2ff;
  }
}

.search-form {
  margin-bottom: 20px;

  .el-input__icon {
    color: #c6e2ff;
    cursor: pointer;
  }

  .el-form-item {
    width: 100%;
  }

  .el-form-item__label {
    width: 30%;
    font-size: 14px;
  }
}
</style>
<style lang="scss">
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
    width: 60%;
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

.select-place {
  input {
    cursor: pointer;
  }
}
</style>
