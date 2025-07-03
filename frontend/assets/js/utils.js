/*
 * AI 自動化 Facebook 發文系統 - 工具函數模組
 *
 * 功能：
 * - 常用工具函數
 * - DOM 操作輔助函數
 * - 數據處理函數
 * - 本地存儲管理
 *
 * 作者：AI Auto Poster 團隊
 * 更新時間：2024-01-01
 * 使用技術：jQuery + Tailwind CSS
 */

class Utils {
  /**
   * 防抖函數
   * @param {Function} func - 要防抖的函數
   * @param {number} delay - 延遲時間（毫秒）
   * @returns {Function} 防抖後的函數
   */
  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 節流函數
   * @param {Function} func - 要節流的函數
   * @param {number} delay - 節流間隔（毫秒）
   * @returns {Function} 節流後的函數
   */
  static throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func.apply(this, args);
    };
  }

  /**
   * 格式化日期
   * @param {Date|string} date - 日期對象或日期字符串
   * @param {string} format - 格式字符串
   * @returns {string} 格式化後的日期字符串
   */
  static formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return "Invalid Date";
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return format.replace("YYYY", year).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
  }

  /**
   * 獲取相對時間
   * @param {Date|string} date - 日期
   * @returns {string} 相對時間字符串
   */
  static getRelativeTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
      return "剛剛";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} 分鐘前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} 小時前`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} 天前`;
    } else {
      return this.formatDate(targetDate, "YYYY-MM-DD");
    }
  }

  /**
   * HTML 字符轉義
   * @param {string} text - 要轉義的文本
   * @returns {string} 轉義後的文本
   */
  static escapeHtml(text) {
    const div = $("<div>").text(text);
    return div.html();
  }

  /**
   * 生成隨機 ID
   * @param {number} length - ID 長度
   * @returns {string} 隨機 ID
   */
  static generateId(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * 深拷貝對象
   * @param {any} obj - 要拷貝的對象
   * @returns {any} 深拷貝後的對象
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeof obj === "object") {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * 合併對象
   * @param {object} target - 目標對象
   * @param {...object} sources - 源對象
   * @returns {object} 合併後的對象
   */
  static mergeObjects(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeObjects(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeObjects(target, ...sources);
  }

  /**
   * 檢查是否為對象
   * @param {any} item - 要檢查的項目
   * @returns {boolean} 是否為對象
   */
  static isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字節數
   * @returns {string} 格式化後的文件大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 驗證電子郵件格式
   * @param {string} email - 電子郵件地址
   * @returns {boolean} 是否為有效的電子郵件格式
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 驗證密碼強度
   * @param {string} password - 密碼
   * @returns {object} 驗證結果
   */
  static validatePassword(password) {
    const result = {
      isValid: false,
      score: 0,
      message: "",
      requirements: {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    };

    // 計算分數
    Object.values(result.requirements).forEach(req => {
      if (req) result.score++;
    });

    // 判斷強度
    if (result.score < 2) {
      result.message = "密碼太弱";
    } else if (result.score < 4) {
      result.message = "密碼強度一般";
    } else {
      result.message = "密碼強度良好";
      result.isValid = true;
    }

    // 必須滿足基本要求
    if (!result.requirements.length) {
      result.isValid = false;
      result.message = "密碼至少需要 8 個字符";
    }

    return result;
  }

  /**
   * 截斷文本
   * @param {string} text - 要截斷的文本
   * @param {number} maxLength - 最大長度
   * @param {string} suffix - 後綴
   * @returns {string} 截斷後的文本
   */
  static truncateText(text, maxLength = 100, suffix = "...") {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 複製文本到剪貼板
   * @param {string} text - 要複製的文本
   * @returns {Promise<boolean>} 是否複製成功
   */
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // 備用方法：使用 textarea
        const $textarea = $("<textarea>")
          .val(text)
          .css({
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
          })
          .appendTo("body");

        $textarea[0].select();
        document.execCommand("copy");
        $textarea.remove();
        return true;
      }
    } catch (error) {
      console.error("複製到剪貼板失敗:", error);
      return false;
    }
  }

  /**
   * 載入圖片
   * @param {string} src - 圖片 URL
   * @returns {Promise<HTMLImageElement>} 載入的圖片元素
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * 檢查是否為移動設備
   * @returns {boolean} 是否為移動設備
   */
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 獲取瀏覽器信息
   * @returns {object} 瀏覽器信息
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";

    if (ua.includes("Chrome")) {
      browser = "Chrome";
      version = ua.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Firefox")) {
      browser = "Firefox";
      version = ua.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Safari")) {
      browser = "Safari";
      version = ua.match(/Version\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Edge")) {
      browser = "Edge";
      version = ua.match(/Edge\/(\d+)/)?.[1] || "Unknown";
    }

    return { browser, version };
  }

  /**
   * 本地存儲管理
   */
  static storage = {
    /**
     * 設置本地存儲
     * @param {string} key - 鍵
     * @param {any} value - 值
     * @param {number} expiry - 過期時間（毫秒）
     */
    set(key, value, expiry = null) {
      const data = {
        value,
        expiry: expiry ? Date.now() + expiry : null,
      };
      localStorage.setItem(key, JSON.stringify(data));
    },

    /**
     * 獲取本地存儲
     * @param {string} key - 鍵
     * @returns {any} 存儲的值
     */
    get(key) {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const data = JSON.parse(item);

        // 檢查是否過期
        if (data.expiry && Date.now() > data.expiry) {
          localStorage.removeItem(key);
          return null;
        }

        return data.value;
      } catch (error) {
        console.error("讀取本地存儲失敗:", error);
        return null;
      }
    },

    /**
     * 移除本地存儲
     * @param {string} key - 鍵
     */
    remove(key) {
      localStorage.removeItem(key);
    },

    /**
     * 清除所有本地存儲
     */
    clear() {
      localStorage.clear();
    },
  };

  /**
   * DOM 操作輔助函數（基於 jQuery）
   */
  static dom = {
    /**
     * 創建元素並添加 Tailwind 類別
     * @param {string} tag - 標籤名
     * @param {string|string[]} classes - CSS 類別
     * @param {object} attributes - 屬性
     * @param {string} content - 內容
     * @returns {jQuery} jQuery 對象
     */
    create(tag, classes = [], attributes = {}, content = "") {
      const $element = $(`<${tag}>`);

      if (typeof classes === "string") {
        classes = classes.split(" ");
      }

      if (classes.length > 0) {
        $element.addClass(classes.join(" "));
      }

      if (Object.keys(attributes).length > 0) {
        $element.attr(attributes);
      }

      if (content) {
        $element.html(content);
      }

      return $element;
    },

    /**
     * 顯示載入狀態
     * @param {jQuery|string} target - 目標元素
     * @param {string} message - 載入訊息
     */
    showLoading(target, message = "載入中...") {
      const $target = typeof target === "string" ? $(target) : target;
      const loadingHtml = `
        <div class="flex items-center justify-center py-8">
          <div class="text-center">
            <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin-slow mb-4 mx-auto"></div>
            <p class="text-gray-600 dark:text-dark-300">${message}</p>
          </div>
        </div>
      `;
      $target.html(loadingHtml);
    },

    /**
     * 顯示錯誤狀態
     * @param {jQuery|string} target - 目標元素
     * @param {string} message - 錯誤訊息
     */
    showError(target, message = "載入失敗") {
      const $target = typeof target === "string" ? $(target) : target;
      const errorHtml = `
        <div class="text-center py-8">
          <div class="text-6xl mb-4">❌</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">載入失敗</h3>
          <p class="text-gray-600 dark:text-dark-300">${message}</p>
        </div>
      `;
      $target.html(errorHtml);
    },

    /**
     * 顯示空狀態
     * @param {jQuery|string} target - 目標元素
     * @param {string} title - 標題
     * @param {string} description - 描述
     * @param {string} icon - 圖標
     */
    showEmpty(target, title = "暫無資料", description = "", icon = "📭") {
      const $target = typeof target === "string" ? $(target) : target;
      const emptyHtml = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">${icon}</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
          ${description ? `<p class="text-gray-600 dark:text-dark-300">${description}</p>` : ""}
        </div>
      `;
      $target.html(emptyHtml);
    },

    /**
     * 平滑滾動到指定元素
     * @param {jQuery|string} target - 目標元素
     * @param {number} offset - 偏移量
     */
    scrollTo(target, offset = 0) {
      const $target = typeof target === "string" ? $(target) : target;
      if ($target.length) {
        $("html, body").animate(
          {
            scrollTop: $target.offset().top - offset,
          },
          500
        );
      }
    },

    /**
     * 添加淡入動畫
     * @param {jQuery|string} element - 元素
     * @param {number} duration - 動畫時長
     */
    fadeIn(element, duration = 300) {
      const $element = typeof element === "string" ? $(element) : element;
      $element.fadeIn(duration);
    },

    /**
     * 添加淡出動畫
     * @param {jQuery|string} element - 元素
     * @param {number} duration - 動畫時長
     */
    fadeOut(element, duration = 300) {
      const $element = typeof element === "string" ? $(element) : element;
      $element.fadeOut(duration);
    },
  };

  /**
   * 網路狀態檢查
   */
  static network = {
    /**
     * 檢查網路連接狀態
     * @returns {boolean} 是否連接到網路
     */
    isOnline() {
      return navigator.onLine;
    },

    /**
     * 監聽網路狀態變化
     * @param {Function} onOnline - 上線回調
     * @param {Function} onOffline - 離線回調
     */
    watchConnection(onOnline, onOffline) {
      $(window).on("online", onOnline);
      $(window).on("offline", onOffline);
    },

    /**
     * 移除網路狀態監聽
     */
    unwatchConnection() {
      $(window).off("online offline");
    },
  };
}

// 導出工具類
window.Utils = Utils;
