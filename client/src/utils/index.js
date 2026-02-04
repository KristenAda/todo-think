import { useAuthorityStore } from '@/stores/authority';
import logInit from './common/log-util';

// 日志初始化
logInit();

// 日期格式化初始化

/**
 * @description 获取浏览器默认语言
 * @returns {String}
 */
export function getBrowserLang() {
  const browserLang = navigator.language
    ? navigator.language
    : navigator.browserLanguage;
  let defaultBrowserLang = '';
  if (['cn', 'zh', 'zh-cn'].includes(browserLang.toLowerCase())) {
    defaultBrowserLang = 'zh';
  } else {
    defaultBrowserLang = 'en';
  }
  return defaultBrowserLang;
}
/**
 * @description 获取当前时间对应的提示语
 * @returns {String}
 */
export function getTimeState() {
  const timeNow = new Date();
  const hours = timeNow.getHours();
  if (hours >= 6 && hours <= 10) return `早上好 ⛅`;
  if (hours >= 10 && hours <= 14) return `中午好 🌞`;
  if (hours >= 14 && hours <= 18) return `下午好 🌞`;
  if (hours >= 18 && hours <= 24) return `晚上好 🌛`;
  if (hours >= 0 && hours <= 6) return `凌晨好 🌛`;
  return '';
}

export function isEmpty(value) {
  // 1. 处理 undefined 和 null
  if (value === undefined || value === null) {
    return true;
  }

  // 2. 处理字符串（包括空白字符）
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  // 3. 处理数组
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // 4. 处理普通对象（不包括 Date/RegExp 等特殊对象）
  if (
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]'
  ) {
    return Object.keys(value).length === 0;
  }

  // 5. 其他类型（数字/布尔值/函数等）均视为非空
  return false;
}

export function isAllPropertiesEmpty(obj) {
  // 1. 处理null和undefined
  if (obj == null) return true;

  // 2. 处理非对象类型（如数字、布尔值等）
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    return false; // 基本类型（非空）不为空
  }

  // 3. 获取对象所有自有属性（包括Symbol属性）
  const keys = Reflect.ownKeys(obj);

  // 4. 若无属性，直接返回true（空对象）
  if (keys.length === 0) return true;

  // 5. 遍历所有属性值，递归检测是否为空
  return keys.every((key) => {
    const value = obj[key];
    return isEmpty(value); // 调用空值检测函数
  });
}

/**
 * @description 获取当前登录用户的单位部门
 * @returns {Object} 单位部门对象
 */
export const getSingleOrg = () => {
  const useAuthority = useAuthorityStore();
  return useAuthority.orgDto;
};

export const getClassType = () => {
  const useAuthority = useAuthorityStore();
  if (useAuthority.deptNo.length !== 11) {
    // 不是供电所
    return '';
  }
  return useAuthority.deptNo.substr(-2); // 最后两位是班组类型，03外勤班，02 内勤班
};
export function downloadFile(blob, fileName) {
  // 其他主流浏览器走这里，利用a 标签的download属性下载
  const binaryData = [];
  binaryData.push(blob);
  const url = window.URL.createObjectURL(new Blob(binaryData));
  // const url = window.URL.createObjectURL(new Blob(binaryData, {
  //   type: "application/vnd.ms-excel",
  //   }))
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
}

// 动态生成 XML 表格
const generateXmlTable = (tableConfig) => {
  const { headers, rows } = tableConfig;

  let xml = `<w:tbl>
        <w:tblPr>
            <w:tblW w:w="0" w:type="auto"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="4" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:color="000000"/>
            </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>`;

  // 生成列定义
  headers.forEach(() => {
    xml += `<w:gridCol w:w="2000"/>`;
  });

  xml += `</w:tblGrid>`;

  // 表头
  xml += `<w:tr>`;
  headers.forEach((header) => {
    xml += `
            <w:tc>
                <w:tcPr>
                    <w:shd w:val="clear" w:color="auto" w:fill="E6E6E6" w:w="0" w:type="auto"/>
                </w:tcPr>
                <w:p>
                    <w:r>
                        <w:t>${header.label}</w:t>
                    </w:r>
                </w:p>
            </w:tc>`;
  });
  xml += `</w:tr>`;

  // 数据行
  rows.forEach((row) => {
    xml += `<w:tr>`;
    headers.forEach((header) => {
      xml += `
                <w:tc>
                    <w:p>
                        <w:r>
                            <w:t>${row[header.prop] || ''}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>`;
    });
    xml += `</w:tr>`;
  });

  xml += `</w:tbl>`;

  return xml;
};

// 在数据准备中使用
export const prepareXmlTableData = (headers, rows) => {
  const tableConfig = {
    headers,
    rows,
  };

  return {
    dynamicTable: generateXmlTable(tableConfig),
  };
};
