// import { getOrgInfoList2 } from '@/apis/modules/test';
// import { useAuthorityStore } from '@/stores/authority';
// import powerSupplyUnit from '@/assets/data/powerSupplyUnit.json';

// const useAuthority = useAuthorityStore();
// // 当前所属单位
// const currentOrg = useAuthority.orgDto;
// const isEnableLocalUnitData = ref(
//   import.meta.env.VITE_APP_ENABLE_LOCAL_UNIT_DATA === 'true',
// );
// const orgList = ref([]);
// const firstGdsCode = ref('');
// 获取树形节点数据
// export const getFirstGdsMgt = () => {
//   const data = {
//     mgtOrgCode: currentOrg,
//   };

//   // 本地开发环境才初始化本地数据
//   if (isEnableLocalUnitData.value) {
//     orgList.value = powerSupplyUnit; // 测试静态数据
//     console.log('orgList.value :>> ', orgList.value);
//     firstGdsCode.value = findFirstValidNode(orgList.value);
//     return firstGdsCode.value; // TODO 注意去掉
//   }

//   // eslint-disable-next-line no-unreachable
//   getOrgInfoList2(data).then((res) => {
//     if (res?.code === 200) {
//       console.log(res);
//       // orgList.value = filterOrgList(res.data) || [];
//       orgList.value = filterOrgList(findOrgByCode(res.data)) || [];
//       firstGdsCode.value = findFirstValidNode(orgList.value);
//     }
//   });
//   return firstGdsCode.value;
//   // eslint-disable-next-line no-unreachable
// };

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
export const findOrgByCode = (orgs: any, currentOrg): any => {
  for (const org of orgs) {
    if (org.mgtOrgCode === currentOrg.mgtOrgCode) {
      return flattenArray([org]);
    }
    if (org.children && org.children.length > 0) {
      const foundInChildren = findOrgByCode(org.children, currentOrg);
      if (Array.isArray(foundInChildren) && foundInChildren.length > 0) {
        return flattenArray(foundInChildren);
      }
    }
  }
  return orgs;
};
// 过滤节点
export const filterOrgList = (orgs: any) => {
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

export const findFirstValidNode = (tree) => {
  // 场景 1：处理单个节点对象（递归内部调用 / 传入单个节点）
  if (typeof tree === 'object' && !Array.isArray(tree) && tree !== null) {
    // 1. 校验当前节点是否符合条件：mgtOrgCode 长度为 9 位
    const mgtOrgCode = String(tree.mgtOrgCode || '');
    if (mgtOrgCode.length === 9) {
      return tree.mgtOrgCode; // 找到第一个符合条件的节点，直接返回，终止递归
    }

    // 2. 当前节点不符合，递归遍历其子节点（深度优先）
    if (Array.isArray(tree.children) && tree.children.length > 0) {
      for (const child of tree.children) {
        const validNode = findFirstValidNode(child);
        // 子节点中找到符合条件的节点，立即返回，终止遍历
        if (validNode) {
          return validNode.mgtOrgCode;
        }
      }
    }

    // 3. 当前节点及子节点均不符合，返回 null
    return '';
  }

  // 场景 2：处理根节点数组（通常树形数据入口是数组）
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const validNode = findFirstValidNode(node);
      // 找到第一个符合条件的节点，立即返回
      if (validNode) {
        return validNode.mgtOrgCode;
      }
    }
  }

  // 场景 3：无效数据 / 无符合条件节点，返回 null
  return '';
};
