/**
 * 授权信息 Store
 * 管理用户信息、token、基础配置地址等授权相关数据
 */
export const useAuthorityStore = defineStore('authority', () => {
  // ========== State 定义 ==========
  // 登录用户信息对象
  const loginInfo = ref<Record<string, any>>({});
  // 认证令牌
  const authToken = ref<string>('');
  // 基础配置地址
  const baseUrl = ref<Record<string, any>>({});

  // 获取当前登录用户的组织信息
  const orgDto = ref<Record<string, any>>({});
  // 获取当前登录用户的部门信息
  const deptNo = ref<string>('');
  // 获取当前登录用户的班组类别
  const classType = ref<string>('');

  // ========== 核心方法 ==========
  /**
   * 初始化授权信息
   * 从 sessionStorage 中读取并加载用户信息、token、baseUrl
   */
  function initAuthorityInfo() {
    const isEnableLocalUnitData =
      import.meta.env.VITE_APP_ENABLE_LOCAL_UNIT_DATA === 'true';
    // 本地开发环境才初始化本地数据
    if (isEnableLocalUnitData) {
      const loginUserInfo = {
        systemUserId: '1',
        userName: '张三',
        orgNo: '51101',
        deptNo: '51416211803',
        mgtOrgPathDTO: {
          mgtOrgDTOList: [
            {
              mgtOrgCode: '51101',
              mgtOrgName: '国网四川省电力公司',
              orgNo: '51101',
            },
          ],
        },
      };
      sessionStorage.setItem('loginUserInfo', JSON.stringify(loginUserInfo));
    }

    try {
      // 1. 读取用户信息
      const userInfoStr = sessionStorage.getItem('loginUserInfo');
      if (userInfoStr) {
        loginInfo.value = JSON.parse(userInfoStr);

        const orgDtoList = loginInfo.value?.mgtOrgPathDTO?.mgtOrgDTOList ?? [];

        const currentOrg = orgDtoList[orgDtoList.length - 1] || {};
        orgDto.value = currentOrg;
        deptNo.value = loginInfo.value?.deptNo || '';
        if (deptNo.value.length !== 11) {
          // 不是供电所
          classType.value = '';
        }
        classType.value = deptNo.value.slice(-2);
      }

      // 2. 读取 token
      authToken.value = sessionStorage.getItem('token') || '';

      // 3. 读取基础配置信息
      const configInfoStr = sessionStorage.getItem('configInfo');
      if (configInfoStr) {
        baseUrl.value = JSON.parse(configInfoStr);
      }
    } catch (error) {
      console.error('初始化授权信息失败：', error);
      // 初始化失败时重置状态，避免数据异常
      loginInfo.value = {};
      authToken.value = '';
      baseUrl.value = {};
      deptNo.value = '';
      classType.value = '';
    }
  }

  function hasEditPermission() {
    const code = orgDto.value?.mgtOrgCode;
    // 判空并检查长度
    return code && code.length >= 9;
  }

  /**
   * 设置登录信息
   * @param loginInfos 登录信息对象
   */
  function setLoginInfo(loginInfos: Record<string, any>) {
    loginInfo.value = loginInfos;
    // 同步更新到 sessionStorage，保证数据一致性
    sessionStorage.setItem('loginUserInfo', JSON.stringify(loginInfos));
  }

  /**
   * 设置认证令牌
   * @param token 认证令牌字符串
   */
  function setAuthToken(token: string) {
    authToken.value = token;
    // 同步更新到 sessionStorage
    sessionStorage.setItem('token', token);
  }

  /**
   * 设置基础配置地址
   * @param configInfo 配置信息对象
   */
  function setBaseUrl(configInfo: Record<string, any>) {
    baseUrl.value = configInfo;
    // 同步更新到 sessionStorage
    sessionStorage.setItem('configInfo', JSON.stringify(configInfo));
  }

  /**
   * 清空授权信息（如退出登录）
   */
  function clearAuthorityInfo() {
    loginInfo.value = {};
    authToken.value = '';
    baseUrl.value = {};
    deptNo.value = '';
    classType.value = '';
    // 清空 sessionStorage 中的对应数据
    sessionStorage.removeItem('loginUserInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('configInfo');
  }
  // ========== 初始化执行 ==========
  // 创建 store 时自动初始化授权信息
  initAuthorityInfo();

  return {
    // 状态
    loginInfo,
    authToken,
    baseUrl,
    orgDto,
    deptNo,
    classType,
    // 方法
    initAuthorityInfo,
    setLoginInfo,
    setAuthToken,
    setBaseUrl,
    clearAuthorityInfo,
    hasEditPermission,
  };
});
