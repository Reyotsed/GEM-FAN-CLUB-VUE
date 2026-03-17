import { Capacitor } from '@capacitor/core';

/**
 * 平台检测工具
 * 用于判断当前运行环境，以便在 Web 和原生 APP 之间做差异化处理
 */

/** 是否运行在原生 APP 中（iOS/Android） */
export const isNative = Capacitor.isNativePlatform();

/** 是否运行在 Android 中 */
export const isAndroid = Capacitor.getPlatform() === 'android';

/** 是否运行在 iOS 中 */
export const isIOS = Capacitor.getPlatform() === 'ios';

/** 是否运行在 Web 浏览器中 */
export const isWeb = Capacitor.getPlatform() === 'web';

/** 获取当前平台名称 */
export const platform = Capacitor.getPlatform();
