/*
 * AI 自動化 Facebook 發文系統 - 通知系統組件
 *
 * 功能：
 * - 創建和管理通知
 * - 支援多種通知類型
 * - 自動消失和手動關閉
 * - 通知隊列管理
 *
 * 作者：AI Auto Poster 團隊
 * 更新時間：2024-01-01
 * 使用技術：jQuery + Tailwind CSS
 */

class NotificationSystem {
  constructor() {
    this.notifications = new Map();
    this.idCounter = 0;
    this.maxNotifications = 5;
    this.defaultDuration = 4000;
    this.container = null;

    this.init();
  }

  /**
   * 初始化通知系統
   */
  init() {
    this.createContainer();
    this.bindEvents();
  }

  /**
   * 創建通知容器
   */
  createContainer() {
    this.container = $("#notification-container");

    if (!this.container.length) {
      this.container = $("<div>").attr("id", "notification-container").addClass("fixed top-4 right-4 z-50 max-w-sm space-y-4").appendTo("body");
    }
  }

  /**
   * 綁定事件
   */
  bindEvents() {
    // 點擊通知關閉
    $(document).on("click", ".notification-close", e => {
      const notificationId = $(e.target).closest(".notification").data("notification-id");
      if (notificationId) {
        this.hide(notificationId);
      }
    });

    // 滑鼠懸停暫停自動關閉
    $(document).on("mouseenter", ".notification", e => {
      const notificationId = $(e.target).closest(".notification").data("notification-id");
      if (notificationId) {
        this.pauseAutoHide(notificationId);
      }
    });

    // 滑鼠離開恢復自動關閉
    $(document).on("mouseleave", ".notification", e => {
      const notificationId = $(e.target).closest(".notification").data("notification-id");
      if (notificationId) {
        this.resumeAutoHide(notificationId);
      }
    });
  }

  /**
   * 顯示通知
   * @param {string} message - 通知訊息
   * @param {string} type - 通知類型 (success, error, warning, info)
   * @param {object} options - 配置選項
   * @returns {string} 通知 ID
   */
  show(message, type = "info", options = {}) {
    const config = {
      title: options.title || this.getTypeTitle(type),
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      closable: options.closable !== false,
      onClick: options.onClick || null,
      persistent: options.persistent || false,
      ...options,
    };

    // 檢查通知數量限制
    this.checkNotificationLimit();

    const id = this.generateId();
    const $notification = this.createNotification(id, message, type, config);

    // 添加到容器
    this.container.append($notification);

    // 添加進入動畫
    setTimeout(() => {
      $notification.addClass("slide-in-right");
    }, 10);

    // 存儲通知信息
    this.notifications.set(id, {
      element: $notification,
      config,
      timer: null,
    });

    // 設置自動隱藏
    if (config.duration > 0 && !config.persistent) {
      this.setAutoHide(id, config.duration);
    }

    return id;
  }

  /**
   * 創建通知元素
   */
  createNotification(id, message, type, config) {
    // 定義通知樣式
    const typeStyles = {
      success: {
        border: "border-l-4 border-green-500",
        bg: "bg-white dark:bg-dark-800",
        icon: "✅",
        iconColor: "text-green-500",
      },
      error: {
        border: "border-l-4 border-red-500",
        bg: "bg-white dark:bg-dark-800",
        icon: "❌",
        iconColor: "text-red-500",
      },
      warning: {
        border: "border-l-4 border-yellow-500",
        bg: "bg-white dark:bg-dark-800",
        icon: "⚠️",
        iconColor: "text-yellow-500",
      },
      info: {
        border: "border-l-4 border-blue-500",
        bg: "bg-white dark:bg-dark-800",
        icon: "ℹ️",
        iconColor: "text-blue-500",
      },
    };

    const style = typeStyles[type] || typeStyles.info;

    const $notification = $(`
      <div class="notification ${style.bg} ${
      style.border
    } rounded-lg shadow-lg p-4 flex items-start space-x-3 transform translate-x-full transition-transform duration-300 ease-out"
           data-notification-id="${id}">
        <div class="flex-shrink-0">
          <span class="text-xl">${style.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          ${config.title ? `<h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">${Utils.escapeHtml(config.title)}</h4>` : ""}
          <p class="text-sm text-gray-700 dark:text-dark-300">${Utils.escapeHtml(message)}</p>
        </div>
        ${
          config.closable
            ? `
          <button class="notification-close flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">
            <span class="sr-only">關閉</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        `
            : ""
        }
      </div>
    `);

    // 添加點擊事件
    if (config.onClick) {
      $notification.css("cursor", "pointer").on("click", e => {
        if (!$(e.target).hasClass("notification-close")) {
          config.onClick(id);
        }
      });
    }

    return $notification;
  }

  /**
   * 獲取類型標題
   */
  getTypeTitle(type) {
    const titles = {
      success: "成功",
      error: "錯誤",
      warning: "警告",
      info: "提示",
    };
    return titles[type] || "通知";
  }

  /**
   * 隱藏通知
   * @param {string} id - 通知 ID
   */
  hide(id) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return false;
    }

    const { element, timer } = notification;

    // 清除定時器
    if (timer) {
      clearTimeout(timer);
    }

    // 添加退出動畫
    element.removeClass("slide-in-right").addClass("transform translate-x-full opacity-0");

    // 動畫完成後移除元素
    setTimeout(() => {
      element.remove();
      this.notifications.delete(id);
    }, 300);

    return true;
  }

  /**
   * 隱藏所有通知
   */
  hideAll() {
    const notificationIds = Array.from(this.notifications.keys());
    notificationIds.forEach(id => this.hide(id));
  }

  /**
   * 設置自動隱藏
   * @param {string} id - 通知 ID
   * @param {number} duration - 持續時間
   */
  setAutoHide(id, duration) {
    const notification = this.notifications.get(id);

    if (!notification) {
      return;
    }

    notification.timer = setTimeout(() => {
      this.hide(id);
    }, duration);
  }

  /**
   * 暫停自動隱藏
   * @param {string} id - 通知 ID
   */
  pauseAutoHide(id) {
    const notification = this.notifications.get(id);

    if (!notification || !notification.timer) {
      return;
    }

    clearTimeout(notification.timer);
    notification.timer = null;
    notification.pausedAt = Date.now();
  }

  /**
   * 恢復自動隱藏
   * @param {string} id - 通知 ID
   */
  resumeAutoHide(id) {
    const notification = this.notifications.get(id);

    if (!notification || !notification.pausedAt) {
      return;
    }

    const remainingTime = notification.config.duration - (notification.pausedAt - notification.createdAt);

    if (remainingTime > 0) {
      this.setAutoHide(id, remainingTime);
    }

    delete notification.pausedAt;
  }

  /**
   * 檢查通知數量限制
   */
  checkNotificationLimit() {
    const currentCount = this.notifications.size;

    if (currentCount >= this.maxNotifications) {
      // 移除最舊的通知
      const oldestId = this.notifications.keys().next().value;
      if (oldestId) {
        this.hide(oldestId);
      }
    }
  }

  /**
   * 生成唯一 ID
   */
  generateId() {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * 成功通知
   * @param {string} message - 訊息
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  /**
   * 錯誤通知
   * @param {string} message - 訊息
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  error(message, options = {}) {
    return this.show(message, "error", {
      duration: 6000, // 錯誤通知顯示更久
      ...options,
    });
  }

  /**
   * 警告通知
   * @param {string} message - 訊息
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  warning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  /**
   * 訊息通知
   * @param {string} message - 訊息
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  /**
   * 載入通知
   * @param {string} message - 訊息
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  loading(message, options = {}) {
    return this.show(message, "info", {
      persistent: true,
      closable: false,
      ...options,
    });
  }

  /**
   * 確認通知（帶按鈕）
   * @param {string} message - 訊息
   * @param {Function} onConfirm - 確認回調
   * @param {Function} onCancel - 取消回調
   * @param {object} options - 選項
   * @returns {string} 通知 ID
   */
  confirm(message, onConfirm, onCancel = null, options = {}) {
    // 這個功能可能需要更複雜的 UI，暫時使用瀏覽器原生 confirm
    const result = confirm(message);
    if (result && onConfirm) {
      onConfirm();
    } else if (!result && onCancel) {
      onCancel();
    }
    return null;
  }

  /**
   * 設置最大通知數量
   * @param {number} max - 最大數量
   */
  setMaxNotifications(max) {
    this.maxNotifications = max;
  }

  /**
   * 設置默認持續時間
   * @param {number} duration - 持續時間（毫秒）
   */
  setDefaultDuration(duration) {
    this.defaultDuration = duration;
  }

  /**
   * 獲取活躍通知數量
   * @returns {number} 活躍通知數量
   */
  getActiveCount() {
    return this.notifications.size;
  }

  /**
   * 檢查是否有指定類型的活躍通知
   * @param {string} type - 通知類型
   * @returns {boolean} 是否存在
   */
  hasActiveNotification(type) {
    for (const notification of this.notifications.values()) {
      if (notification.config.type === type) {
        return true;
      }
    }
    return false;
  }
}

// 創建全局通知實例
const Notification = new NotificationSystem();

// 導出通知系統
window.Notification = Notification;
window.NotificationSystem = NotificationSystem;

// 對於模組系統的導出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Notification, NotificationSystem };
}
