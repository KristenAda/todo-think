/* eslint-disable */
import { forIn } from 'lodash-es';
import * as XLSX from 'xlsx';
import xlsxStyle from 'xlsx-style-ts';
import { saveAs } from 'file-saver';

/**
 * 获取列文字最大长度
 * @param {} value
 * @returns
 */
const getCellWidth = (value) => {
  // 判断是否为null或undefined
  if (!value) {
    return 6;
  }
  if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
    // 中文的长度
    const chineseLength = value.match(/[\u4e00-\u9fa5]/g).length;
    // 其他不是中文的长度
    const otherLength = value.length - chineseLength;
    return chineseLength * 3 + otherLength * 2;
  }
  return value.toString().length * 2;
};

const s2ab = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
};

/**
 * 导出简单表格Excel
 * @param {*} jsonData 导出的数据格式 [{表头：值,表头：值,表头：值,表头：值},{...}]
 * @param {*} fileName 导出的文件名称
 * @param {*} sheetName sheet名称
 */
const exportJsonDataToSimpleExcel = (
  jsonData,
  fileName = 'excel',
  sheetName = 'sheet',
) => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(jsonData);
    const keyWordNum = {};
    let isFirst = true;

    for (const item of jsonData) {
      for (const key of Object.keys(item)) {
        const value = item[key];
        const cellWidth = getCellWidth(value);
        if (!keyWordNum[key]) {
          keyWordNum[key] = cellWidth;
          if (isFirst) {
            keyWordNum[key] = Math.max(cellWidth, getCellWidth(key), 6);
          }
        } else {
          keyWordNum[key] = Math.max(cellWidth, keyWordNum[key], 6);
        }
      }
      isFirst = false;
    }

    const colsWidth = [];
    const rowsWidth = [];

    forIn(keyWordNum, (value) => {
      colsWidth.push({ wch: value });
    });

    for (let index = 0; index <= jsonData.length; index += 1) {
      rowsWidth.push({ hpx: 26 });
    }

    // 设置每列的列宽，10代表10个字符，注意中文占2个字符
    ws['!cols'] = colsWidth;
    ws['!rows'] = rowsWidth;

    // #region 设置单元格

    for (const key in ws) {
      if (
        key !== '!cols' &&
        key !== '!fullref' &&
        key !== '!merges' &&
        key !== '!ref' &&
        key !== '!rows'
      ) {
        // 这里的s就是具体的样式，如果想设置不一样的样式可以看xlsx-style文档
        const cellIndex = key.replace(/[a-zA-Z]+/g, '');
        ws[key].s = {
          // 边框
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          },
          // 对齐
          alignment: {
            // horizontal: "top",
            vertical: 'center',
            // wrapText: true,
          },
          font: {
            // name: "宋体",
            sz: 12,
            bold: parseInt(cellIndex, 10) === 1,
          },
        };
      }
    }

    // #endregion
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    // xlsxStyle.writeFile(wb, `${fileName + new Date().getTime()}.xlsx`);

    const wbout = xlsxStyle.write(wb, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
    });
    const cBlob = new Blob([s2ab(wbout)], {
      type: 'application/octet-stream',
    });
    try {
      saveAs(cBlob, `${fileName}-${new Date().getTime()}.xlsx`);
    } catch (e) {
      if (typeof console !== 'undefined') console.log(e, wbout);
    }
  } catch (error) {
    console.log(error);
  }
};

export { exportJsonDataToSimpleExcel };
