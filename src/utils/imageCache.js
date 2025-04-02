/**
 * 图片缓存工具
 * 用于缓存图片URL，避免重复请求相同的图片
 */

// 图片缓存对象，键为图片路径，值为图片URL
const imageCache = new Map();

/**
 * 获取图片URL，如果缓存中有则直接返回，否则返回null
 * @param {string} path - 图片路径
 * @returns {string|null} - 缓存的图片URL或null
 */
export function getCachedImage(path) {
  return imageCache.get(path) || null;
}

/**
 * 缓存图片URL
 * @param {string} path - 图片路径
 * @param {string} url - 图片URL
 */
export function cacheImage(path, url) {
  imageCache.set(path, url);
}

/**
 * 清除图片缓存
 * @param {string} [path] - 可选的图片路径，如果不提供则清除所有缓存
 */
export function clearImageCache(path) {
  if (path) {
    imageCache.delete(path);
  } else {
    imageCache.clear();
  }
}

/**
 * 获取缓存大小
 * @returns {number} - 缓存中的图片数量
 */
export function getCacheSize() {
  return imageCache.size;
} 