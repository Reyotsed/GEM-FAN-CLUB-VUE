/**
 * 轻量日志封装：dev 模式下正常打印，prod 静默
 * vite.config.js 已配置 terser drop_console，这里主要为 dev 降噪
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => { if (isDev) console.log(...args); },
  warn: (...args) => { if (isDev) console.warn(...args); },
  error: (...args) => console.error(...args), // error 总是保留
  debug: (...args) => { if (isDev) console.debug(...args); },
};
