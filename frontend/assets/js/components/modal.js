/**
 * =============================================================================
 * 模態框組件系統 (Modal Component System)
 * =============================================================================
 *
 * 此模組提供完整的模態框管理功能，包含：
 * - 動態創建和管理模態框
 * - 多種尺寸和樣式支援
 * - 鍵盤導航和無障礙支援
 * - 焦點管理和陷阱機制
 * - 多層模態框堆疊
 * - 自定義按鈕和事件處理
 *
 * 使用 jQuery 進行 DOM 操作和事件處理
 * 使用 Tailwind CSS 進行樣式設計
 *
 * @fileoverview 模態框組件管理系統
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 *
 * @requires jQuery 3.7.1+
 * @requires utils.js (工具函數模組)
 *
 * @example
 * // 基本模態框
 * Modal.create({
 *   title: '確認操作',
 *   content: '您確定要執行此操作嗎？',
 *   buttons: [
 *     { text: '取消', class: 'btn-secondary' },
 *     { text: '確認', class: 'btn-primary', onclick: () => console.log('confirmed') }
 *   ]
 * });
 *
 * // 便捷方法
 * Modal.confirm('確定要刪除這個項目嗎？').then(result => {
 *   if (result) console.log('用戶確認了');
 * });
 * =============================================================================
 */

/**
 * 模態框系統類別
 * 管理模態框的創建、顯示、隱藏和銷毀
 *
 * @class ModalSystem
 */
class ModalSystem {
  /**
   * 創建模態框系統實例
   *
   * @constructor
   */
  constructor() {
    /** @type {Map<string, object>} 存儲所有模態框的映射 */
    this.modals = new Map();

    /** @type {string|null} 當前活躍的模態框 ID */
    this.activeModal = null;

    /** @type {number} 模態框 ID 計數器 */
    this.idCounter = 0;

    /** @type {Array} ESC 鍵處理堆疊 */
    this.escapeStack = [];

    /** @type {Element|null} 之前聚焦的元素 */
    this.previousFocus = null;

    this.init();
  }

  /**
   * 初始化模態框系統
   */
  init() {
    this.bindGlobalEvents();
  }

  /**
   * 綁定全局事件
   */
  bindGlobalEvents() {
    // ESC 鍵關閉模態框
    $(document).on("keydown", e => {
      if (e.key === "Escape" && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    // 點擊遮罩關閉模態框
    $(document).on("click", ".modal-backdrop", e => {
      if (e.target === e.currentTarget) {
        const $modal = $(e.target).closest(".modal-container");
        const modalId = $modal.data("modal-id");
        if (modalId) {
          this.close(modalId);
        }
      }
    });

    // 焦點陷阱
    $(document).on("keydown", e => {
      if (e.key === "Tab" && this.activeModal) {
        this.handleTabKey(e);
      }
    });
  }

  /**
   * 創建並顯示模態框
   *
   * @param {object} options - 模態框配置選項
   * @param {string} options.title - 模態框標題
   * @param {string|jQuery} options.content - 模態框內容
   * @param {string} options.size - 模態框尺寸 (sm, md, lg, xl)
   * @param {boolean} options.closable - 是否可關閉
   * @param {boolean} options.backdropClose - 點擊背景是否關閉
   * @param {Array} options.buttons - 按鈕配置數組
   * @param {string} options.className - 自定義CSS類名
   * @param {Function} options.onShow - 顯示回調
   * @param {Function} options.onHide - 隱藏回調
   * @returns {string} 模態框 ID
   */
  create(options = {}) {
    const config = {
      title: options.title || "",
      content: options.content || "",
      size: options.size || "md", // sm, md, lg, xl
      closable: options.closable !== false,
      backdropClose: options.backdropClose !== false,
      buttons: options.buttons || [],
      className: options.className || "",
      onShow: options.onShow || null,
      onHide: options.onHide || null,
      ...options,
    };

    const id = this.generateId();
    const $modal = this.createModalElement(id, config);

    $("body").append($modal);
    this.modals.set(id, { element: $modal, config });

    // 顯示模態框
    this.show(id);

    return id;
  }

  /**
   * 創建模態框元素
   *
   * @param {string} id - 模態框 ID
   * @param {object} config - 配置對象
   * @returns {jQuery} 模態框 jQuery 元素
   */
  createModalElement(id, config) {
    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
    };

    const $modal = $(`
      <div class="modal-container fixed inset-0 z-50 overflow-y-auto ${config.className}"
           data-modal-id="${id}"
           data-backdrop-close="${config.backdropClose}"
           role="dialog"
           aria-modal="true"
           aria-labelledby="modal-title-${id}"
           style="display: none;">
        <!-- 背景遮罩 -->
        <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 opacity-0"></div>

        <!-- 模態框內容 -->
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="modal-content relative bg-white dark:bg-dark-800 rounded-lg shadow-xl transform transition-all duration-300 w-full ${
            sizeClasses[config.size]
          } border border-gray-200 dark:border-dark-700 scale-95 opacity-0">
            ${this.createHeader(id, config)}
            ${this.createBody(config)}
            ${this.createActions(id, config)}
          </div>
        </div>
      </div>
    `);

    return $modal;
  }

  /**
   * 創建模態框標頭
   *
   * @param {string} id - 模態框 ID
   * @param {object} config - 配置對象
   * @returns {string} 標頭 HTML
   */
  createHeader(id, config) {
    if (!config.title && !config.closable) {
      return "";
    }

    let header = '<div class="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">';

    if (config.title) {
      header += `<h3 id="modal-title-${id}" class="text-xl font-semibold text-gray-900 dark:text-white">${Utils.escapeHtml(config.title)}</h3>`;
    }

    if (config.closable) {
      header += `
        <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                aria-label="關閉"
                data-modal-id="${id}">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;
    }

    header += "</div>";
    return header;
  }

  /**
   * 創建模態框主體
   *
   * @param {object} config - 配置對象
   * @returns {string} 主體 HTML
   */
  createBody(config) {
    let content = "";

    if (typeof config.content === "string") {
      content = config.content;
    } else if (config.content instanceof jQuery) {
      content = config.content.prop("outerHTML");
    }

    return `<div class="modal-body p-6 text-gray-700 dark:text-gray-300">${content}</div>`;
  }

  /**
   * 創建模態框操作按鈕區域
   *
   * @param {string} id - 模態框 ID
   * @param {object} config - 配置對象
   * @returns {string} 操作區域 HTML
   */
  createActions(id, config) {
    if (!config.buttons || config.buttons.length === 0) {
      return "";
    }

    let actions = '<div class="modal-actions flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-dark-700">';

    config.buttons.forEach((button, index) => {
      const btnClass = button.class || "bg-gray-600 hover:bg-gray-700 text-white";
      actions += `
        <button class="modal-btn px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${btnClass}"
                data-modal-id="${id}"
                data-btn-index="${index}">
          ${Utils.escapeHtml(button.text)}
        </button>
      `;
    });

    actions += "</div>";
    return actions;
  }

  /**
   * 顯示模態框
   *
   * @param {string} id - 模態框 ID
   * @returns {boolean} 是否成功顯示
   */
  show(id) {
    const modalData = this.modals.get(id);

    if (!modalData) {
      return false;
    }

    const { element: $modal, config } = modalData;

    // 記錄當前焦點元素
    this.previousFocus = document.activeElement;

    // 隱藏其他模態框
    if (this.activeModal && this.activeModal !== id) {
      this.hide(this.activeModal);
    }

    // 防止背景滾動
    $("body").addClass("overflow-hidden");

    // 設置為活躍模態框
    this.activeModal = id;

    // 綁定事件
    this.bindModalEvents($modal, id, config);

    // 顯示動畫
    $modal.show();

    setTimeout(() => {
      $modal.find(".modal-backdrop").addClass("opacity-50");
      $modal.find(".modal-content").addClass("scale-100 opacity-100");

      // 設置焦點到第一個可聚焦元素
      const $focusable = this.getFocusableElements($modal);
      if ($focusable.length > 0) {
        $focusable.first().focus();
      }

      // 執行顯示回調
      if (config.onShow) {
        config.onShow(id);
      }
    }, 10);

    return true;
  }

  /**
   * 綁定模態框事件
   *
   * @param {jQuery} $modal - 模態框元素
   * @param {string} id - 模態框 ID
   * @param {object} config - 配置對象
   */
  bindModalEvents($modal, id, config) {
    // 關閉按鈕事件
    $modal.find(".modal-close").on("click", () => {
      this.close(id);
    });

    // 操作按鈕事件
    $modal.find(".modal-btn").on("click", e => {
      const btnIndex = $(e.target).data("btn-index");
      const button = config.buttons[btnIndex];

      if (button && button.onclick) {
        const result = button.onclick(e, id);
        // 如果處理器返回 false，不關閉模態框
        if (result !== false && button.closeModal !== false) {
          this.close(id);
        }
      } else if (!button || button.closeModal !== false) {
        this.close(id);
      }
    });
  }

  /**
   * 隱藏模態框
   *
   * @param {string} id - 模態框 ID，如果省略則隱藏當前活躍的模態框
   * @returns {boolean} 是否成功隱藏
   */
  hide(id = null) {
    const targetId = id || this.activeModal;

    if (!targetId) {
      return false;
    }

    const modalData = this.modals.get(targetId);

    if (!modalData) {
      return false;
    }

    const { element: $modal, config } = modalData;

    // 隱藏動畫
    $modal.find(".modal-backdrop").removeClass("opacity-50");
    $modal.find(".modal-content").removeClass("scale-100 opacity-100");

    setTimeout(() => {
      $modal.hide();

      // 執行隱藏回調
      if (config.onHide) {
        config.onHide(targetId);
      }
    }, 300);

    // 如果是當前活躍模態框，清除狀態
    if (this.activeModal === targetId) {
      this.activeModal = null;

      // 恢復背景滾動
      $("body").removeClass("overflow-hidden");

      // 恢復焦點
      if (this.previousFocus) {
        $(this.previousFocus).focus();
        this.previousFocus = null;
      }
    }

    return true;
  }

  /**
   * 關閉並銷毀模態框
   *
   * @param {string} id - 模態框 ID
   * @returns {boolean} 是否成功關閉
   */
  close(id) {
    if (this.hide(id)) {
      setTimeout(() => {
        this.destroy(id);
      }, 300);
      return true;
    }
    return false;
  }

  /**
   * 銷毀模態框
   *
   * @param {string} id - 模態框 ID
   * @returns {boolean} 是否成功銷毀
   */
  destroy(id) {
    const modalData = this.modals.get(id);

    if (!modalData) {
      return false;
    }

    const { element: $modal } = modalData;

    // 移除事件監聽器
    $modal.off();

    // 從 DOM 中移除
    $modal.remove();

    // 從映射中移除
    this.modals.delete(id);

    return true;
  }

  /**
   * 關閉所有模態框
   */
  closeAll() {
    const modalIds = Array.from(this.modals.keys());
    modalIds.forEach(id => this.close(id));
  }

  /**
   * 處理 Tab 鍵導航
   *
   * @param {Event} e - 鍵盤事件
   */
  handleTabKey(e) {
    const modalData = this.modals.get(this.activeModal);

    if (!modalData) {
      return;
    }

    const $focusable = this.getFocusableElements(modalData.element);

    if ($focusable.length === 0) {
      return;
    }

    const firstElement = $focusable.first()[0];
    const lastElement = $focusable.last()[0];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * 獲取可聚焦元素
   *
   * @param {jQuery} $container - 容器元素
   * @returns {jQuery} 可聚焦元素的 jQuery 集合
   */
  getFocusableElements($container) {
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    return $container.find(focusableSelectors).filter(":visible");
  }

  /**
   * 生成唯一 ID
   *
   * @returns {string} 唯一 ID
   */
  generateId() {
    return `modal-${++this.idCounter}`;
  }

  /**
   * 更新模態框內容
   *
   * @param {string} id - 模態框 ID
   * @param {string|jQuery} content - 新內容
   * @returns {boolean} 是否成功更新
   */
  updateContent(id, content) {
    const modalData = this.modals.get(id);

    if (!modalData) {
      return false;
    }

    const $modal = modalData.element;
    const $body = $modal.find(".modal-body");

    if (typeof content === "string") {
      $body.html(content);
    } else if (content instanceof jQuery) {
      $body.empty().append(content);
    }

    return true;
  }

  /**
   * 確認對話框
   *
   * @param {string|object} options - 確認訊息或配置對象
   * @returns {Promise<boolean>} 用戶選擇結果
   */
  confirm(options = {}) {
    return new Promise(resolve => {
      const config = typeof options === "string" ? { message: options } : options;

      this.create({
        title: config.title || "確認",
        content: `<p>${Utils.escapeHtml(config.message || "您確定要執行此操作嗎？")}</p>`,
        size: "sm",
        buttons: [
          {
            text: "取消",
            class: "bg-gray-600 hover:bg-gray-700 text-white",
            onclick: () => resolve(false),
          },
          {
            text: "確認",
            class: "bg-red-600 hover:bg-red-700 text-white",
            onclick: () => resolve(true),
          },
        ],
      });
    });
  }

  /**
   * 警告對話框
   *
   * @param {string} message - 警告訊息
   * @param {string} title - 對話框標題
   * @returns {Promise<void>} Promise 對象
   */
  alert(message, title = "提示") {
    return new Promise(resolve => {
      this.create({
        title: title,
        content: `<p>${Utils.escapeHtml(message)}</p>`,
        size: "sm",
        buttons: [
          {
            text: "確定",
            class: "bg-primary-600 hover:bg-primary-700 text-white",
            onclick: () => resolve(),
          },
        ],
      });
    });
  }

  /**
   * 輸入對話框
   *
   * @param {object} options - 配置選項
   * @returns {Promise<string|null>} 用戶輸入的值或 null
   */
  prompt(options = {}) {
    return new Promise(resolve => {
      const inputId = `prompt-input-${this.generateId()}`;

      this.create({
        title: options.title || "輸入",
        content: `
          <div class="space-y-4">
            <p class="text-gray-700 dark:text-gray-300">${Utils.escapeHtml(options.message || "請輸入值：")}</p>
            <input
              type="text"
              id="${inputId}"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-700 dark:text-white"
              value="${Utils.escapeHtml(options.defaultValue || "")}"
              placeholder="${Utils.escapeHtml(options.placeholder || "")}"
            />
          </div>
        `,
        size: options.size || "sm",
        buttons: [
          {
            text: options.cancelText || "取消",
            class: "bg-gray-600 hover:bg-gray-700 text-white",
            onclick: () => resolve(null),
          },
          {
            text: options.confirmText || "確認",
            class: "bg-primary-600 hover:bg-primary-700 text-white",
            onclick: () => {
              const value = $(`#${inputId}`).val();
              resolve(value);
            },
          },
        ],
        onShow: () => {
          // 聚焦到輸入框
          setTimeout(() => $(`#${inputId}`).focus(), 100);
        },
      });
    });
  }

  /**
   * 獲取當前活躍模態框 ID
   *
   * @returns {string|null} 活躍模態框 ID
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * 檢查是否有活躍模態框
   *
   * @returns {boolean} 是否有活躍模態框
   */
  hasActiveModal() {
    return !!this.activeModal;
  }

  /**
   * 便捷方法：創建並顯示模態框
   *
   * @param {object} options - 模態框配置選項
   * @returns {string} 模態框 ID
   */
  show(options = {}) {
    return this.create(options);
  }
}

// 創建全局模態框系統實例
window.Modal = new ModalSystem();

// 對於模組系統的導出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ModalSystem, Modal: window.Modal };
}
