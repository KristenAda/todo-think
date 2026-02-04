import { isEmpty } from 'lodash-es';

// 算法
const Algorithm = {
  Arithmetic: 1, // 等差法
  Dichotomy: 2, // 二分法
};

// 算法最小质量
const algorithmMinQuality = {};
algorithmMinQuality[Algorithm.Arithmetic] = 0.1;
algorithmMinQuality[Algorithm.Dichotomy] = 0.01;

// 算法实现
const algorithmImplementation = {};
algorithmImplementation[Algorithm.Arithmetic] = (quality) => {
  return Math.max(quality - 0.1, algorithmMinQuality[Algorithm.Arithmetic]);
};
algorithmImplementation[Algorithm.Dichotomy] = (quality) => {
  return Math.max(quality / 2, algorithmMinQuality[Algorithm.Dichotomy]);
};

// 默认配置
const defaultOptions = {
  width: undefined,
  height: undefined,
  rectScale: undefined,
  size: undefined,
  sizeScale: undefined,

  initialSizeScale: 0.8,
  algorithm: Algorithm.Dichotomy,
};

/**
 * 检查配置
 * @param {Object} options 配置宽高和比例
 */
function checkOptions(options) {
  if (options.width <= 0 || options.height <= 0) {
    throw new Error(
      'In options, "width" or "height" should be over than 0 if set this.',
    );
  }
  if (options.rectScale <= 0 || options.rectScale > 1) {
    throw new Error(
      'In options, "rectScale" should be between 0(cannot be 0) and 1 if set this.',
    );
  }
  if (options.size <= 0) {
    throw new Error('In options, "size" should be over than 0 if set this.');
  }
  if (options.sizeScale <= 0 || options.sizeScale > 1) {
    throw new Error(
      'In options, "sizeScale" should be between 0(cannot be 0) and 1 if set this.',
    );
  }
  if (options.initialSizeScale <= 0 || options.initialSizeScale > 1) {
    throw new Error(
      'In options, "initialSizeScale" should be between 0(cannot be 0) and 1 if set this.',
    );
  }
}

/**
 * 获取裁剪宽高
 * @param {Object} origin 原图宽高
 * @param {Object} options 配置宽高和比例
 * @returns {Object} 待裁剪宽高
 */
function getWidthAndHeight(origin, options) {
  let widthScale;
  if (options.width) {
    if (origin.width <= options.width) {
      widthScale = 1;
    }
    widthScale = origin.width / options.width;
  }

  let heightScale;
  if (options.height) {
    if (origin.height <= options.height) {
      heightScale = 1;
    }
    heightScale = origin.height / options.height;
  }

  // 如果宽高未配置，则使用比例
  if (isEmpty(widthScale) && isEmpty(heightScale)) {
    widthScale = options.rectScale;
    heightScale = options.rectScale;
  }

  if (
    isEmpty(widthScale) &&
    isEmpty(heightScale) &&
    isEmpty(options.rectScale)
  ) {
    // 如果宽高及比例均未配置，则不裁剪宽高
    return origin;
  }
  if (widthScale === undefined) {
    // 如果仅宽度未配置，则宽度按等比裁剪
    widthScale = heightScale;
  } else if (heightScale === undefined) {
    // 如果仅高度未配置，则高度按等比裁剪
    heightScale = widthScale;
  } else if (widthScale !== heightScale) {
    // 如果宽高裁剪比例不同，则使用最小裁剪比例
    widthScale = Math.min(widthScale, heightScale);

    heightScale = Math.min(widthScale, heightScale);
  }

  return {
    width: origin.width * widthScale,
    height: origin.height * heightScale,
  };
}

/**
 * 获取图片画布
 * @param {Image} image 图片对象
 * @param {Object} options 配置
 * @returns {HTMLCanvasElement} 画布
 */
function getImageCanvas(image, options) {
  const rect = getWidthAndHeight(
    {
      width: image.width,
      height: image.height,
    },
    options,
  );

  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/**
 * 压缩核心算法
 * @param {Element} canvas 画布
 * @param {Object} options 配置
 * @returns {Promise} 异步
 */
function compressCore(canvas, options) {
  const newOptions = options;
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (
          options.size === -1 ||
          blob.size <= options.size ||
          options.quality <= algorithmMinQuality[options.algorithm]
        ) {
          // 1不指定大小；2压缩后已小于指定大小；3压缩质量已最低
          // 满足上述任一条件，则不再压缩
          resolve(blob);
        } else {
          newOptions.quality = algorithmImplementation[options.algorithm](
            options.quality,
          );
          resolve(compressCore(canvas, newOptions));
        }
      },
      'image/jpeg',
      options.quality,
    );
  });
}

function Compressor(options) {
  this.options = { ...defaultOptions, ...options };
}

/**
 * 更新配置
 * @param {Object} options 配置
 * @returns {Compressor} this
 */
Compressor.prototype.options = (options) => {
  this.options = Object.assign(this.options, options);
  return this;
};

/**
 * 执行压缩
 * @param {String} src 资源
 * @returns {Promise} 异步
 */
Compressor.prototype.compress = (src) => {
  const that = this;
  checkOptions(this.options);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = (e) => {
      const curImage = e.target;
      const canvas = getImageCanvas(curImage, that.options);

      compressCore(canvas, {
        quality: that.options.sizeScale || that.options.initialSizeScale,
        size: that.options.sizeScale ? -1 : that.options.size,
        algorithm: that.options.algorithm,
      })
        .then((blob) => {
          resolve(blob);
        })
        .catch((er) => {
          reject(er);
        });
    };
    image.onerror = (e) => {
      reject(e);
    };

    // 跨域资源需特殊设置
    image.setAttribute('crossOrigin', 'Anonymous');
    image.src = src;
  });
};

export default Compressor;
