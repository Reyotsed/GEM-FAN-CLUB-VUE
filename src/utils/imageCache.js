/**
 * 图片缓存工具
 * 用于缓存图片URL，避免重复请求相同的图片
 */

// 图片缓存对象，使用 Map 保持插入顺序
const imageCache = new Map();
const MAX_CACHE_SIZE = 50; // 最大缓存数量

/**
 * 获取图片URL，如果缓存中有则直接返回，否则返回null
 * @param {string} path - 图片路径
 * @returns {string|null} - 缓存的图片URL或null
 */
export function getCachedImage(path) {
  if (imageCache.has(path)) {
    // LRU: 访问时将其移动到末尾（表示最近使用）
    const url = imageCache.get(path);
    imageCache.delete(path);
    imageCache.set(path, url);
    return url;
  }
  return null;
}

/**
 * 缓存图片URL
 * @param {string} path - 图片路径
 * @param {string} url - 图片URL
 */
export function cacheImage(path, url) {
  if (imageCache.has(path)) {
    // 如果已存在，更新位置
    imageCache.delete(path);
  } else if (imageCache.size >= MAX_CACHE_SIZE) {
    // 如果缓存已满，删除最早插入的（第一个）
    const firstKey = imageCache.keys().next().value;
    const firstUrl = imageCache.get(firstKey);
    // 释放 URL 对象以避免内存泄漏
    if (firstUrl && firstUrl.startsWith('blob:')) {
      URL.revokeObjectURL(firstUrl);
    }
    imageCache.delete(firstKey);
  }
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