/**
 * =============================================================================
 * 表單處理組件系統 (Form Handler Component System)
 * =============================================================================
 *
 * 此模組提供完整的表單處理功能，包含：
 * - 即時表單驗證系統
 * - 自定義驗證規則引擎
 * - 表單序列化和數據處理
 * - 自動錯誤訊息顯示
 * - AJAX 表單提交支援
 * - 表單狀態管理
 *
 * 使用 jQuery 進行 DOM 操作和事件處理
 * 使用 Tailwind CSS 進行樣式設計
 *
 * @fileoverview 表單處理組件管理系統
 * @version 2.0.0
 * @author AI Assistant
 * @created 2024-01-20
 * @modified 2024-01-20
 *
 * @requires jQuery 3.7.1+
 * @requires utils.js (工具函數模組)
 *
 * @example
 * // 基本用法
 * const handler = new FormHandler($('#myForm'), {
 *   validateOnBlur: true,
 *   onSubmit: async (data) => {
 *     return await API.post('/api/submit', data);
 *   }
 * });
 *
 * // 工廠方法
 * FormFactory.autoInit('form[data-auto-validate]');
 * =============================================================================
 */

/**
 * 表單處理器類別
 * 處理表單驗證、提交和狀態管理
 *
 * @class FormHandler
 */
class FormHandler {
  /**
   * 創建表單處理器實例
   *
   * @constructor
   * @param {jQuery} $formElement - 表單 jQuery 元素
   * @param {object} options - 配置選項
   * @param {boolean} options.validateOnBlur - 失焦時驗證
   * @param {boolean} options.validateOnInput - 輸入時驗證
   * @param {boolean} options.autoSubmit - 自動提交
   * @param {boolean} options.showSuccessMessage - 顯示成功訊息
   * @param {string} options.successMessage - 成功訊息文字
   * @param {boolean} options.resetOnSuccess - 成功後重置表單
   * @param {Function} options.onSubmit - 提交處理函數
   */
  constructor($formElement, options = {}) {
    /** @type {jQuery} 表單 jQuery 元素 */
    this.$form = $formElement;

    /** @type {object} 配置選項 */
    this.options = {
      validateOnBlur: true,
      validateOnInput: false,
      autoSubmit: false,
      showSuccessMessage: true,
      successMessage: "操作成功",
      resetOnSuccess: false,
      ...options,
    };

    /** @type {Map<string, Function>} 驗證器映射 */
    this.validators = new Map();

    /** @type {boolean} 是否正在提交 */
    this.isSubmitting = false;

    this.init();
  }

  /**
   * 初始化表單處理器
   */
  init() {
    this.setupEventListeners();
    this.setupDefaultValidators();
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 表單提交事件
    this.$form.on("submit", e => {
      e.preventDefault();
      this.handleSubmit();
    });

    // 表單元素驗證事件
    const $inputs = this.$form.find("input, textarea, select");

    $inputs.each((index, element) => {
      const $input = $(element);

      if (this.options.validateOnBlur) {
        $input.on("blur", () => {
          this.validateField($input);
        });
      }

      if (this.options.validateOnInput) {
        $input.on(
          "input",
          Utils.debounce(() => {
            this.validateField($input);
          }, 300)
        );
      }

      // 清除錯誤狀態
      $input.on("focus", () => {
        this.clearFieldError($input);
      });
    });
  }

  /**
   * 設置默認驗證器
   */
  setupDefaultValidators() {
    // 必填欄位驗證
    this.addValidator("required", (value, $element) => {
      if ($element.prop("required") && !value.trim()) {
        return "此欄位為必填";
      }
      return null;
    });

    // 電子郵件驗證
    this.addValidator("email", (value, $element) => {
      if ($element.attr("type") === "email" && value && !Utils.isValidEmail(value)) {
        return "請輸入有效的電子郵件地址";
      }
      return null;
    });

    // 密碼驗證
    this.addValidator("password", (value, $element) => {
      if ($element.attr("type") === "password" && value) {
        const validation = Utils.validatePassword(value);
        if (!validation.isValid) {
          return validation.message;
        }
      }
      return null;
    });

    // 確認密碼驗證
    this.addValidator("confirmPassword", (value, $element) => {
      if ($element.attr("name") === "confirmPassword" || $element.attr("id") === "confirmPassword") {
        const $passwordField = this.$form.find('input[type="password"]:not([name="confirmPassword"])');
        if ($passwordField.length && value !== $passwordField.val()) {
          return "密碼確認不一致";
        }
      }
      return null;
    });

    // 最小長度驗證
    this.addValidator("minLength", (value, $element) => {
      const minLength = $element.attr("minlength");
      if (minLength && value && value.length < parseInt(minLength)) {
        return `最少需要 ${minLength} 個字符`;
      }
      return null;
    });

    // 最大長度驗證
    this.addValidator("maxLength", (value, $element) => {
      const maxLength = $element.attr("maxlength");
      if (maxLength && value && value.length > parseInt(maxLength)) {
        return `最多只能 ${maxLength} 個字符`;
      }
      return null;
    });

    // 數字範圍驗證
    this.addValidator("range", (value, $element) => {
      if ($element.attr("type") === "number" && value) {
        const min = $element.attr("min");
        const max = $element.attr("max");
        const numValue = parseFloat(value);

        if (min && numValue < parseFloat(min)) {
          return `值不能小於 ${min}`;
        }
        if (max && numValue > parseFloat(max)) {
          return `值不能大於 ${max}`;
        }
      }
      return null;
    });

    // 正則表達式驗證
    this.addValidator("pattern", (value, $element) => {
      const pattern = $element.attr("pattern");
      if (pattern && value) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return $element.attr("title") || "格式不正確";
        }
      }
      return null;
    });
  }

  /**
   * 添加自定義驗證器
   *
   * @param {string} name - 驗證器名稱
   * @param {Function} validator - 驗證函數
   */
  addValidator(name, validator) {
    this.validators.set(name, validator);
  }

  /**
   * 移除驗證器
   *
   * @param {string} name - 驗證器名稱
   */
  removeValidator(name) {
    this.validators.delete(name);
  }

  /**
   * 驗證單個欄位
   *
   * @param {jQuery} $element - 表單元素 jQuery 對象
   * @returns {boolean} 是否驗證通過
   */
  validateField($element) {
    const value = $element.val() || "";
    const errors = [];

    // 執行所有驗證器
    for (const [name, validator] of this.validators) {
      try {
        const error = validator(value, $element);
        if (error) {
          errors.push(error);
        }
      } catch (e) {
        console.error(`驗證器 ${name} 執行錯誤:`, e);
      }
    }

    // 自定義驗證
    const customValidator = $element.data("validator");
    if (customValidator && window[customValidator]) {
      const customError = window[customValidator](value, $element[0]);
      if (customError) {
        errors.push(customError);
      }
    }

    // 顯示或清除錯誤
    if (errors.length > 0) {
      this.showFieldError($element, errors[0]);
      return false;
    } else {
      this.clearFieldError($element);
      return true;
    }
  }

  /**
   * 驗證整個表單
   *
   * @returns {boolean} 是否驗證通過
   */
  validateForm() {
    const $inputs = this.$form.find("input, textarea, select");
    let isValid = true;

    $inputs.each((index, element) => {
      const $input = $(element);
      if (!this.validateField($input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * 顯示欄位錯誤
   *
   * @param {jQuery} $element - 表單元素
   * @param {string} message - 錯誤訊息
   */
  showFieldError($element, message) {
    // 移除現有錯誤樣式
    this.clearFieldError($element, false);

    // 添加錯誤樣式
    $element.addClass("border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20");
    $element.removeClass("border-gray-300 dark:border-gray-600");

    // 創建或更新錯誤訊息
    const errorId = `error-${$element.attr("id") || $element.attr("name") || Date.now()}`;
    let $errorElement = $(`#${errorId}`);

    if ($errorElement.length === 0) {
      $errorElement = $(`
        <div id="${errorId}" class="error-message text-red-600 dark:text-red-400 text-sm mt-1">
          ${Utils.escapeHtml(message)}
        </div>
      `);
      $element.after($errorElement);
    } else {
      $errorElement.text(message);
    }

    // 設置 aria-describedby 屬性以改善無障礙性
    $element.attr("aria-describedby", errorId);
    $element.attr("aria-invalid", "true");
  }

  /**
   * 清除欄位錯誤
   *
   * @param {jQuery} $element - 表單元素
   * @param {boolean} removeStyle - 是否移除錯誤樣式
   */
  clearFieldError($element, removeStyle = true) {
    if (removeStyle) {
      $element.removeClass("border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20");
      $element.addClass("border-gray-300 dark:border-gray-600");
      $element.removeAttr("aria-describedby aria-invalid");
    }

    // 移除錯誤訊息
    const errorId = $element.attr("aria-describedby");
    if (errorId) {
      $(`#${errorId}`).remove();
    }
  }

  /**
   * 序列化表單數據
   *
   * @returns {object} 表單數據對象
   */
  serialize() {
    const data = {};
    const formData = this.$form.serializeArray();

    formData.forEach(field => {
      // 處理複選框陣列
      if (data[field.name]) {
        if (Array.isArray(data[field.name])) {
          data[field.name].push(field.value);
        } else {
          data[field.name] = [data[field.name], field.value];
        }
      } else {
        data[field.name] = field.value;
      }
    });

    // 處理未選中的複選框
    this.$form.find('input[type="checkbox"]:not(:checked)').each((index, element) => {
      const $checkbox = $(element);
      const name = $checkbox.attr("name");
      if (name && !data.hasOwnProperty(name)) {
        data[name] = false;
      }
    });

    return data;
  }

  /**
   * 填充表單數據
   *
   * @param {object} data - 要填充的數據
   */
  populate(data) {
    Object.keys(data).forEach(key => {
      const $elements = this.$form.find(`[name="${key}"]`);

      $elements.each((index, element) => {
        const $element = $(element);
        const type = $element.attr("type");
        const value = data[key];

        if (type === "radio" || type === "checkbox") {
          $element.prop("checked", $element.val() == value);
        } else {
          $element.val(value);
        }
      });
    });
  }

  /**
   * 重置表單
   */
  reset() {
    this.$form[0].reset();

    // 清除所有錯誤狀態
    this.$form.find("input, textarea, select").each((index, element) => {
      this.clearFieldError($(element));
    });

    // 重置提交狀態
    this.setSubmitState(false);
  }

  /**
   * 處理表單提交
   */
  async handleSubmit() {
    if (this.isSubmitting) {
      return;
    }

    // 驗證表單
    if (!this.validateForm()) {
      return;
    }

    try {
      this.setSubmitState(true);

      const formData = this.serialize();
      let result;

      // 使用自定義提交處理器或默認處理器
      if (this.options.onSubmit) {
        result = await this.options.onSubmit(formData, this);
      } else {
        result = await this.defaultSubmit(formData);
      }

      this.handleSuccess(result);
    } catch (error) {
      console.error("表單提交錯誤:", error);
      this.handleError(error.message || "提交失敗，請稍後重試");
    } finally {
      this.setSubmitState(false);
    }
  }

  /**
   * 默認提交處理
   *
   * @param {object} data - 表單數據
   * @returns {Promise<object>} 提交結果
   */
  async defaultSubmit(data) {
    const action = this.$form.attr("action") || window.location.pathname;
    const method = this.$form.attr("method") || "POST";

    return await API.request(method, action, data);
  }

  /**
   * 處理提交成功
   *
   * @param {object} result - 提交結果
   */
  handleSuccess(result) {
    if (this.options.showSuccessMessage) {
      if (typeof Notification !== "undefined") {
        Notification.show(result?.message || this.options.successMessage, "success");
      } else {
        alert(result?.message || this.options.successMessage);
      }
    }

    if (this.options.resetOnSuccess) {
      this.reset();
    }

    // 觸發成功事件
    this.$form.trigger("form:success", [result]);
  }

  /**
   * 處理提交錯誤
   *
   * @param {string} message - 錯誤訊息
   */
  handleError(message) {
    if (typeof Notification !== "undefined") {
      Notification.show(message, "error");
    } else {
      alert(message);
    }

    // 觸發錯誤事件
    this.$form.trigger("form:error", [message]);
  }

  /**
   * 設置提交狀態
   *
   * @param {boolean} isSubmitting - 是否正在提交
   */
  setSubmitState(isSubmitting) {
    this.isSubmitting = isSubmitting;

    // 更新提交按鈕狀態
    const $submitButton = this.$form.find('button[type="submit"], input[type="submit"]');

    if (isSubmitting) {
      $submitButton.prop("disabled", true);
      $submitButton.addClass("opacity-50 cursor-not-allowed");

      // 添加載入指示器
      const originalText = $submitButton.text();
      $submitButton.data("original-text", originalText);
      $submitButton.html(`
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        處理中...
      `);
    } else {
      $submitButton.prop("disabled", false);
      $submitButton.removeClass("opacity-50 cursor-not-allowed");

      // 恢復按鈕文字
      const originalText = $submitButton.data("original-text");
      if (originalText) {
        $submitButton.text(originalText);
      }
    }
  }

  /**
   * 銷毀表單處理器
   */
  destroy() {
    // 移除事件監聽器
    this.$form.off();

    // 清除驗證器
    this.validators.clear();

    // 清除錯誤狀態
    this.reset();
  }
}

/**
 * 表單工廠類別
 * 提供便捷的表單處理器創建方法
 *
 * @class FormFactory
 */
class FormFactory {
  /**
   * 創建表單處理器實例
   *
   * @static
   * @param {string|jQuery} selector - 表單選擇器或 jQuery 元素
   * @param {object} options - 配置選項
   * @returns {FormHandler|Array<FormHandler>} 表單處理器實例
   */
  static create(selector, options = {}) {
    const $forms = $(selector);

    if ($forms.length === 0) {
      console.warn(`找不到匹配的表單: ${selector}`);
      return null;
    }

    if ($forms.length === 1) {
      return new FormHandler($forms.eq(0), options);
    }

    // 多個表單時返回陣列
    const handlers = [];
    $forms.each((index, form) => {
      handlers.push(new FormHandler($(form), options));
    });

    return handlers;
  }

  /**
   * 自動初始化表單
   *
   * @static
   * @param {string} selector - 表單選擇器
   * @param {object} options - 配置選項
   * @returns {Array<FormHandler>} 表單處理器陣列
   */
  static autoInit(selector = "form[data-auto-validate]", options = {}) {
    const handlers = [];

    $(selector).each((index, form) => {
      const $form = $(form);

      // 從 data 屬性讀取配置
      const dataOptions = {
        validateOnBlur: $form.data("validate-on-blur") !== false,
        validateOnInput: $form.data("validate-on-input") === true,
        showSuccessMessage: $form.data("show-success-message") !== false,
        successMessage: $form.data("success-message") || "操作成功",
        resetOnSuccess: $form.data("reset-on-success") === true,
      };

      const mergedOptions = { ...dataOptions, ...options };
      handlers.push(new FormHandler($form, mergedOptions));
    });

    return handlers;
  }
}

// 頁面載入完成後自動初始化
$(document).ready(() => {
  FormFactory.autoInit();
});

// 導出到全局
window.FormHandler = FormHandler;
window.FormFactory = FormFactory;

// 對於模組系統的導出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { FormHandler, FormFactory };
}
