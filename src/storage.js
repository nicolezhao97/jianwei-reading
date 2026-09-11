// 独立部署版本没有 Claude 的 window.storage 后端接口，
// 这里用浏览器 localStorage 模拟出同样的方法签名，
// 这样从 Claude Artifact 版本搬过来的 App.jsx 几乎不用改代码。
//
// 注意：这意味着数据只保存在"这一台设备的这个浏览器"里——
// 换手机、换浏览器、清除网站数据都会丢失，和 Claude 版本的账号级云存储不是一回事。
// 如果需要跨设备同步，需要自己接一个云数据库（比如 Supabase、Firebase）替换这个文件。

const PREFIX = "jianwei:";

function installStorageShim() {
  if (typeof window === "undefined") return;
  if (window.storage) return; // 如果已经存在（比如仍在 Claude 环境里跑），不要覆盖

  window.storage = {
    async get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return null;
        return { key, value: raw, shared: false };
      } catch (e) {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, value);
        return { key, value, shared: false };
      } catch (e) {
        return null;
      }
    },
    async delete(key) {
      try {
        const existed = localStorage.getItem(PREFIX + key) !== null;
        localStorage.removeItem(PREFIX + key);
        return { key, deleted: existed, shared: false };
      } catch (e) {
        return null;
      }
    },
    async list(prefix = "") {
      const keys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
        }
      } catch (e) {}
      return { keys, prefix, shared: false };
    },
  };
}

installStorageShim();
export default installStorageShim;
